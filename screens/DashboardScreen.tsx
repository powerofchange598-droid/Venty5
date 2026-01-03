import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { User, Transaction, BudgetCategory, FixedExpense, ExpenseData, IncomeData } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import PageLayout from '../components/PageLayout';
import VentyButton from '../components/VentyButton';
import Card from '../components/Card';
import { useToast } from '../hooks/useToast';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { MinusCircleIcon, ArrowUpCircleIcon, ArrowsRightLeftIcon, BuildingLibraryIcon, BellIcon, SparklesIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import { safeFormatDate } from '../utils/dateUtils';

// --- PROPS ---
interface DashboardScreenProps {
    user: User;
    isPremiumUser: boolean;
    transactions: Transaction[];
    budget: BudgetCategory[];
    fixedExpenses: FixedExpense[];
}

// --- MOTION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } },
};

// --- MODAL & FORM COMPONENTS ---

const ActionModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50"
                initial="hidden" animate="visible" exit="exit" variants={backdropVariants} onClick={onClose}
            >
                <motion.div
                    className="bg-bg-secondary rounded-xl shadow-lg w-full max-w-md p-6"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants as any}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-serif">{title}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-tertiary"><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const todayISO = new Date().toISOString().split('T')[0];

const ExpenseForm: React.FC<{ categories: BudgetCategory[]; onSubmit: (data: ExpenseData) => void; onClose: () => void; }> = ({ categories, onSubmit, onClose }) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');
    const [date, setDate] = useState(todayISO);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category) return;
        onSubmit({ amount: parseFloat(amount), category, date, notes });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="font-medium text-sm">Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="w-full mt-1"/></div>
            <div><label className="font-medium text-sm">Category</label><select value={category} onChange={e => setCategory(e.target.value)} required className="w-full mt-1">{categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select></div>
            <div><label className="font-medium text-sm">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1"/></div>
            <div><label className="font-medium text-sm">Notes (Optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Lunch with colleagues" className="w-full mt-1"></textarea></div>
            <VentyButton htmlType="submit" onClick={()=>{}}>Add Expense</VentyButton>
        </form>
    );
};

const IncomeForm: React.FC<{ onSubmit: (data: IncomeData) => void; onClose: () => void; }> = ({ onSubmit, onClose }) => {
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [date, setDate] = useState(todayISO);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !source) return;
        onSubmit({ amount: parseFloat(amount), source, date, notes });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="font-medium text-sm">Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="w-full mt-1"/></div>
            <div><label className="font-medium text-sm">Source</label><input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g., Freelance Project" required className="w-full mt-1"/></div>
            <div><label className="font-medium text-sm">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1"/></div>
            <div><label className="font-medium text-sm">Notes (Optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Final payment for website design" className="w-full mt-1"></textarea></div>
            <VentyButton htmlType="submit" onClick={()=>{}}>Add Income</VentyButton>
        </form>
    );
};

type TransferType = 'internal' | 'user' | 'wallet' | 'linked';

const TransferForm: React.FC<{
    availableBalance: number;
    onSubmit: (payload: { amount: number; type: TransferType; direction: 'out' | 'in'; target?: string; notes?: string; }) => void;
    onClose: () => void;
}> = ({ availableBalance, onSubmit, onClose }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransferType>('internal');
    const [direction, setDirection] = useState<'out' | 'in'>('out');
    const [target, setTarget] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [confirm, setConfirm] = useState(false);

    const validate = () => {
        const n = Number(amount);
        if (!Number.isFinite(n) || n <= 0) { setError('Enter a valid amount'); return false; }
        if (direction === 'out' && n > availableBalance) { setError('Insufficient balance'); return false; }
        if ((type === 'user' || type === 'linked') && !target.trim()) { setError('Recipient/Method required'); return false; }
        setError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (!confirm) { setConfirm(true); return; }
        onSubmit({ amount: Number(amount), type, direction, target: target.trim() || undefined, notes: notes.trim() || undefined });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-baseline">
                <label className="font-medium text-sm">Available</label>
                <span className="text-sm font-semibold">{availableBalance.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
            </div>
            <div>
                <label className="font-medium text-sm">Amount</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="w-full mt-1"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="font-medium text-sm">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as TransferType)} className="w-full mt-1">
                        <option value="internal">Internal Balance</option>
                        <option value="user">User-to-User</option>
                        <option value="wallet">Wallet</option>
                        <option value="linked">Linked Method</option>
                    </select>
                </div>
                <div>
                    <label className="font-medium text-sm">Direction</label>
                    <select value={direction} onChange={e => setDirection(e.target.value as 'out' | 'in')} className="w-full mt-1">
                        <option value="out">Send</option>
                        <option value="in">Receive</option>
                    </select>
                </div>
            </div>
            {(type === 'user' || type === 'linked') && (
                <div>
                    <label className="font-medium text-sm">{type === 'user' ? 'Recipient (User ID / email)' : 'Payment Method / Ref'}</label>
                    <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder={type === 'user' ? 'jane.doe@example.com' : '****-****-1234'} className="w-full mt-1"/>
                </div>
            )}
            <div>
                <label className="font-medium text-sm">Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Rent split" className="w-full mt-1"></textarea>
            </div>
            {error && <p className="text-xs text-feedback-error bg-feedback-error-bg rounded px-2 py-1">{error}</p>}
            <VentyButton htmlType="submit" variant={confirm ? 'primary' : 'secondary'} className="!w-full">
                {confirm ? 'Confirm Transfer' : 'Continue'}
            </VentyButton>
        </form>
    );
};


// --- SUB-COMPONENTS for the Dashboard ---

const Header: React.FC<{ name: string }> = ({ name }) => (
    <motion.header variants={itemVariants} className="pt-2 md:pt-4 text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Hello, {name.split(' ')[0]}!</h1>
        <p className="text-sm md:text-base text-text-secondary">Welcome to your financial dashboard.</p>
    </motion.header>
);

const DailySummaryCard: React.FC<{ formatCurrency: (val: number) => string }> = ({ formatCurrency }) => {
    const data = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ name: `Page ${i}`, uv: Math.random() * 300 + 100 })), []);
    return (
        <motion.div variants={itemVariants} className="card md:col-span-2 card-border-accent">
            <div className="flex justify-between">
                <div>
                    <p className="text-xs md:text-sm font-semibold text-text-secondary">Today's Spending</p>
                    <p className="text-2xl md:text-3xl font-bold text-text-primary">{formatCurrency(75.50)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs md:text-sm font-semibold text-text-secondary">Allowance Remaining</p>
                    <p className="text-2xl md:text-3xl font-bold text-feedback-success">{formatCurrency(124.50)}</p>
                </div>
            </div>
            {/* Fixed Chart Container: Height adjusted and minWidth added for robustness */}
            <div className="h-20 mt-4 -mx-4 md:-mx-6 -mb-4 md:-mb-6" style={{ minHeight: '80px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={80} minWidth={0}>
                    <AreaChart data={data}>
                        <defs><linearGradient id="daily-spark" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/></linearGradient></defs>
                        <Area type="monotone" dataKey="uv" stroke="var(--brand-primary)" strokeWidth={2} fill="url(#daily-spark)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

const QuickActions: React.FC<{ onAddExpenseClick: () => void; onAddIncomeClick: () => void; onTransferClick: () => void; }> = ({ onAddExpenseClick, onAddIncomeClick, onTransferClick }) => {
    return (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 md:gap-4 md:col-span-2 lg:col-span-3">
            <VentyButton onClick={onAddExpenseClick} variant="primary" aria-label="Add a new expense" className="flex-col !p-2 h-auto min-h-[80px] justify-center">
                <MinusCircleIcon className="h-6 w-6 mb-1" />
                <span className="text-xs text-center">Expense</span>
            </VentyButton>
            <VentyButton onClick={onAddIncomeClick} variant="primary" aria-label="Add a new income source" className="flex-col !p-2 h-auto min-h-[80px] justify-center">
                <ArrowUpCircleIcon className="h-6 w-6 mb-1" />
                <span className="text-xs text-center">Income</span>
            </VentyButton>
            <VentyButton onClick={onTransferClick} variant="primary" aria-label="Transfer funds between accounts" className="flex-col !p-2 h-auto min-h-[80px] justify-center">
                <ArrowsRightLeftIcon className="h-6 w-6 mb-1" />
                <span className="text-xs text-center">Transfer</span>
            </VentyButton>
        </motion.div>
    );
};

const CircularProgress: React.FC<{ percentage: number; }> = ({ percentage }) => {
    const radius = 36; // Slightly smaller for mobile
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle className="text-bg-tertiary" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50"/>
            <motion.circle className="text-brand-primary" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" strokeDasharray={circumference} strokeLinecap="round" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeInOut" }}/>
        </svg>
    );
};

const FinancialHealthCard: React.FC = () => (
    <motion.div variants={itemVariants} className="card flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 md:w-24 md:h-24 relative">
            <CircularProgress percentage={78} />
             <p className="absolute inset-0 flex items-center justify-center text-xl md:text-2xl font-bold">{78}</p>
        </div>
        <p className="text-xs md:text-sm font-semibold text-text-secondary mt-2">Health: <span className="text-feedback-success">Stable</span></p>
    </motion.div>
);

const SmartInsightCard: React.FC = () => (
    <motion.div variants={itemVariants} className="card p-4">
        <div className="flex items-start space-x-3">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary"><SparklesIcon className="h-6 w-6"/></div>
            <div>
                <p className="font-semibold text-text-primary text-sm md:text-base">AI Smart Insight</p>
                <p className="text-xs md:text-sm text-text-secondary mt-1">Your 'Groceries' spending is 15% lower than last week. Great job!</p>
            </div>
        </div>
    </motion.div>
);

const UpcomingPaymentsCard: React.FC<{ formatCurrency: (v: number) => string }> = ({ formatCurrency }) => {
    const payments = [ { icon: BellIcon, name: 'Netflix', date: 'in 3 days', amount: 15.99 }, { icon: BuildingLibraryIcon, name: 'Rent', date: 'in 7 days', amount: 1200 } ];
    return (
        <motion.div variants={itemVariants} className="card md:col-span-2 p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm md:text-base">Upcoming Payments</h2>
            <div className="space-y-3">
                {payments.map(p => (
                    <div key={p.name} className="flex items-center space-x-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary"><p.icon className="h-4 w-4 text-text-secondary"/></div >
                        <div className="flex-grow"><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-text-secondary">{p.date}</p></div>
                        <p className="font-semibold text-sm">{formatCurrency(p.amount)}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const RecentActivityCard: React.FC<{ transactions: Transaction[], formatCurrency: (v: number) => string }> = ({ transactions, formatCurrency }) => {
    const navigate = useNavigate();
    const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    return (
        <motion.div variants={itemVariants} className="card p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm md:text-base">Recent Activity</h2>
            <div className="space-y-3">
                {recent.map(t => {
                    const isPositive = t.amount >= 0;
                    const val = `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}`;
                    return (
                        <div key={t.id} className="flex items-center space-x-3 p-2 -mx-2 rounded-lg transition-all duration-200 hover:bg-bg-tertiary">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary"><p className="text-sm">{t.icon}</p></div>
                            <div className="flex-grow"><p className="font-medium text-sm truncate max-w-[140px]">{t.description}</p><p className="text-xs text-text-secondary">{safeFormatDate(t.date)}</p></div>
                            <p className={`font-semibold text-sm ${isPositive ? 'text-feedback-success' : 'text-feedback-error'}`}>{val}</p>
                        </div>
                    );
                })}
                {recent.length === 0 && (
                    <p className="text-sm text-text-secondary text-center">No recent activity yet</p>
                )}
            </div>
            <button onClick={() => navigate('/financial-snapshot')} className="text-xs md:text-sm font-semibold text-brand-primary w-full text-center mt-4 flex items-center justify-center">View All <ArrowRightIcon className="h-3 w-3 ml-1"/></button>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---
const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, isPremiumUser, transactions, budget, fixedExpenses }) => {
    const navigate = useNavigate();
    const { formatCurrency } = useLocalization();
    const { showToast } = useToast();
    const [modal, setModal] = useState<'expense' | 'income' | 'transfer' | null>(null);
    const [localTx, setLocalTx] = useState<Transaction[]>(transactions);
    const [transferImpact, setTransferImpact] = useState(0); // negative for out, positive for in

    const {
        totalBudget,
        totalExpenses,
        budgetUsedPercentage,
        remainingBudget,
        insight
    } = useMemo(() => {
        const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const disposableIncome = user.salary - totalFixed;
        const totalVariableSpent = budget.reduce((sum, c) => sum + c.spent, 0);
        const percentage = disposableIncome > 0 ? (totalVariableSpent / disposableIncome) * 100 : 0;
        
        let insightText = "You're right on track.";
        if (percentage > 95) { insightText = "You've gone over budget."; } 
        else if (percentage > 80) { insightText = "Getting close to budget limit."; }
        
        return {
            totalBudget: disposableIncome,
            totalExpenses: totalVariableSpent,
            budgetUsedPercentage: Math.min(percentage, 100),
            remainingBudget: disposableIncome - totalVariableSpent,
            insight: insightText,
        };
    }, [user, budget, fixedExpenses, transferImpact]);
    
    const handleAddExpense = useCallback((data: ExpenseData) => {
        showToast(`Expense of ${formatCurrency(data.amount)} added!`, 'success');
    }, [showToast, formatCurrency]);

    const handleAddIncome = useCallback((data: IncomeData) => {
        showToast(`Income of ${formatCurrency(data.amount)} added!`, 'success');
    }, [showToast, formatCurrency]);

    const handleTransfer = useCallback(async (payload: { amount: number; type: TransferType; direction: 'out' | 'in'; target?: string; notes?: string; }) => {
        const res = await api.transfer(user.id, payload);
        if (!res.ok) { showToast('Transfer failed. Please try again.', 'error'); return; }
        const signed = payload.direction === 'out' ? -Math.abs(payload.amount) : Math.abs(payload.amount);
        setTransferImpact(prev => prev + signed);
        setLocalTx(prev => [
            { id: res.data?.id || `tx_${Date.now()}`, description: `Transfer ${payload.type}${payload.target ? ` → ${payload.target}` : ''}`, amount: signed, date: new Date().toISOString(), icon: '⇄' } as Transaction,
            ...prev,
        ]);
        showToast(`Transfer successful. Ref: ${res.data?.id || 'local'}`, 'success');
    }, [showToast]);

    return (
        <PageLayout title="Home" showHeader={false}>
            <ActionModal isOpen={modal === 'expense'} onClose={() => setModal(null)} title="Add New Expense">
                <ExpenseForm categories={budget} onSubmit={handleAddExpense} onClose={() => setModal(null)} />
            </ActionModal>
            <ActionModal isOpen={modal === 'income'} onClose={() => setModal(null)} title="Add New Income">
                <IncomeForm onSubmit={handleAddIncome} onClose={() => setModal(null)} />
            </ActionModal>
            <ActionModal isOpen={modal === 'transfer'} onClose={() => setModal(null)} title="Transfer">
                <TransferForm availableBalance={Math.max(0, remainingBudget)} onSubmit={handleTransfer} onClose={() => setModal(null)} />
            </ActionModal>

            <motion.div 
                className="py-4 md:py-6 space-y-4 md:space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <Header name={user.name} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <DailySummaryCard formatCurrency={formatCurrency} />
                    
                    <div className="grid grid-cols-2 gap-4 md:hidden">
                         <FinancialHealthCard />
                         <SmartInsightCard />
                    </div>
                    <div className="hidden md:block">
                         <FinancialHealthCard />
                    </div>

                    <QuickActions onAddExpenseClick={() => setModal('expense')} onAddIncomeClick={() => setModal('income')} onTransferClick={() => setModal('transfer')} />
                    {/* Move transfer CTA into QuickActions component render below */}

                    <motion.div variants={itemVariants} className="card p-4 flex flex-col justify-between">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-2">Snapshot</h2>
                            <div className="flex justify-between items-baseline mb-1"><p className="text-text-secondary text-sm">Expenses</p><p className="text-xl font-bold text-text-primary">{formatCurrency(totalExpenses)}</p></div>
                            <div className="flex justify-between items-baseline"><p className="text-text-secondary text-sm">Used</p><p className="text-xl font-bold text-brand-primary">{budgetUsedPercentage.toFixed(0)}%</p></div>
                        </div>
                        <div className="mt-3">
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${budgetUsedPercentage}%` }}></div></div>
                            <p className="text-xs text-text-secondary mt-2 text-center">{insight}</p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="card p-4 flex flex-col justify-between">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-2">Summary</h2>
                            <div className="flex justify-between items-baseline mb-1"><p className="text-text-secondary text-sm">Budget</p><p className="text-lg font-semibold text-text-primary">{formatCurrency(totalBudget)}</p></div>
                            <div className="flex justify-between items-baseline"><p className="text-text-secondary text-sm">Left</p><p className="text-lg font-semibold text-feedback-success">{formatCurrency(remainingBudget)}</p></div>
                        </div>
                        <div className="mt-3">
                            <VentyButton onClick={() => navigate('/budget')} variant="secondary" className="!w-full !py-2 !text-xs md:!text-sm">View Details</VentyButton>
                        </div>
                    </motion.div>
                    
                    <div className="hidden md:block">
                         <SmartInsightCard />
                    </div>

                    <UpcomingPaymentsCard formatCurrency={formatCurrency} />
                    
                    <RecentActivityCard transactions={localTx} formatCurrency={formatCurrency} />
                </div>
            </motion.div>
        </PageLayout>
    );
};

export default DashboardScreen;
