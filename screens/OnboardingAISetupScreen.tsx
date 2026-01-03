
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, BudgetCategory, FixedExpense, Goal, AdType } from '../types';
import PageLayout from '../components/PageLayout';
import VentyButton from '../components/VentyButton';
import { TrashIcon, ClipboardDocumentListIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { useLocalization } from '../hooks/useLocalization';
import Card from '../components/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const expenseCategories: Record<string, { icon: string }> = {
    rent: { icon: '🏠' },
    mortgage: { icon: '🏠' },
    housing: { icon: '🏠' },
    utilities: { icon: '💡' },
    bills: { icon: '💡' },
    internet: { icon: '🌐' },
    phone: { icon: '📱' },
    transport: { icon: '🚗' },
    transportation: { icon: '🚗' },
    fuel: { icon: '⛽' },
    education: { icon: '🎓' },
    insurance: { icon: '🛡️' },
    household: { icon: '🏡' },
    gym: { icon: '🏋️‍♂️' },
    installments: { icon: '💳' },
    loan: { icon: '💳' },
    savings: { icon: '💰' },
    investments: { icon: '💰' },
    subscriptions: { icon: '🧾' },
    food: { icon: '🛒' },
    groceries: { icon: '🛒' },
    other: { icon: '📦' },
};

const PIE_COLORS = ['var(--brand-primary)', 'var(--brand-accent)', 'var(--text-secondary)', 'var(--feedback-success)', 'var(--feedback-warning)'];

const ExpenseSummary: React.FC<{
    expenses: Record<string, number>;
    formatCurrency: (val: number) => string;
    onRemove: (name: string) => void;
    onFinish: () => void;
}> = ({ expenses, formatCurrency, onRemove, onFinish }) => {
    const expenseEntries: [string, number][] = Object.entries(expenses).map(([name, amount]) => [name, Number(amount)]);
    const total = expenseEntries.reduce((sum: number, [, amount]: [string, number]) => sum + Number(amount), 0);

    return (
        <div className="flex flex-col h-full p-4">
            <h2 className="text-xl font-bold font-serif mb-4 flex-shrink-0 flex items-center gap-2 text-text-primary">
                <ClipboardDocumentListIcon className="h-6 w-6 text-brand-primary" />
                Expenses Summary
            </h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                {expenseEntries.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">Your fixed expenses will appear here as you add them.</p>
                ) : (
                    expenseEntries.map(([name, amount]) => (
                        <Card key={name} className="!p-2 flex justify-between items-center bg-bg-primary">
                            <span className="font-semibold text-text-body">{name}</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-brand-primary">{formatCurrency(amount)}</span>
                                <button onClick={() => onRemove(name)} className="p-1 text-text-secondary hover:text-feedback-error"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-bg-tertiary flex-shrink-0">
                 <Card className="!p-3 mb-4">
                    <div className="flex justify-between font-bold text-lg text-text-primary">
                        <span>Total Fixed Costs:</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </Card>
                <VentyButton
                    onClick={onFinish}
                    disabled={expenseEntries.length === 0}
                    variant="primary"
                >
                    Finish Setup ({expenseEntries.length} expenses) <ArrowRightIcon className="w-4 h-4 ml-2" />
                </VentyButton>
            </div>
        </div>
    );
};

const AddExpenseForm: React.FC<{onAdd: (name: string, amount: number) => void}> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if(name.trim() && !isNaN(numAmount) && numAmount > 0) {
            onAdd(name.trim(), numAmount);
            setName('');
            setAmount('');
        }
    }

    return (
        <Card className="!p-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                    <label className="font-medium text-sm text-text-body">Expense Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Rent, Internet" className="w-full mt-1" required/>
                </div>
                <div>
                    <label className="font-medium text-sm text-text-body">Amount</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 3000" className="w-full mt-1" required/>
                </div>
                <div className="sm:col-span-3">
                    <VentyButton htmlType="submit" onClick={() => {}} className="!w-full !py-2 !text-sm" label={<><PlusIcon className="h-5 w-5 mr-1"/> Add Expense</>}></VentyButton>
                </div>
            </form>
        </Card>
    )
}

interface OnboardingAISetupScreenProps {
    user: User;
    budget: BudgetCategory[];
    isOnboarding?: boolean;
    onComplete?: (data: { fixedExpenses: FixedExpense[], newBudget: BudgetCategory[], goals: Goal[], salary?: number, familyMembers?: number }) => void;
}

const OnboardingAISetupScreen: React.FC<OnboardingAISetupScreenProps> = ({ user, onComplete, isOnboarding = false }) => {
    const { formatCurrency } = useLocalization();
    const [onboardingExpenses, setOnboardingExpenses] = useState<Record<string, number>>({});
    const [view, setView] = useState<'entry' | 'summary'>('entry');
    const [income, setIncome] = useState<number>(Number(user.salary) || 0);
    const [household, setHousehold] = useState<number>(Number(user.familyMembers) || 1);
    
    const handleAddExpense = (name: string, amount: number) => {
        setOnboardingExpenses(prev => ({...prev, [name]: amount}));
    }

    const handleRemoveExpense = (expenseName: string) => {
        setOnboardingExpenses(prev => {
            const newExpenses = { ...prev };
            delete newExpenses[expenseName];
            return newExpenses;
        });
    };

    const handleOnboardingFinish = () => {
        if (!onComplete) return;
        const finalExpenses: FixedExpense[] = Object.entries(onboardingExpenses).map(([name, amount], index) => {
            const key = Object.keys(expenseCategories).find(k => name.toLowerCase().includes(k)) || 'other';
            return {
                id: `onboard-${index}`,
                name: name,
                amount: Number(amount),
                frequency: 'monthly',
                icon: expenseCategories[key].icon,
            };
        });
        onComplete({ fixedExpenses: finalExpenses, newBudget: [], goals: [], salary: income > 0 ? income : undefined, familyMembers: household > 0 ? household : undefined });
    };
    
    const totalFixedExpenses = Object.keys(onboardingExpenses).reduce((sum, key) => sum + (onboardingExpenses[key] || 0), 0);
    const baseIncome = income > 0 ? income : Number(user.salary) || 0;
    const fixedCostPercentage = baseIncome > 0 ? (totalFixedExpenses / baseIncome) * 100 : 0;
    const remainingIncome = baseIncome - totalFixedExpenses;
    
    const pieData = [
        { name: 'Fixed Costs', value: totalFixedExpenses },
        { name: 'Remaining for Budget', value: remainingIncome > 0 ? remainingIncome : 0 },
    ];
    
    const aiSummary = fixedCostPercentage > 70
        ? `Your fixed costs are ${fixedCostPercentage.toFixed(0)}% of your income. This is quite high, which may limit your flexible spending and savings.`
        : `Your fixed costs are ${fixedCostPercentage.toFixed(0)}% of your income. You're managing your core expenses well!`;
    const aiSurvival = `If you maintain this pattern, you’ll have ${formatCurrency(remainingIncome)} left for the rest of the month.`;
    
    return (
        <PageLayout title={"Onboarding"}>
            {view === 'entry' ? (
                <motion.div key="onboarding-entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row h-full">
                    {/* Entry Panel */}
                    <div className="flex-grow flex flex-col bg-bg-primary lg:w-2/3 h-full p-4 space-y-4">
                        <h1 className="text-2xl font-bold font-serif text-text-primary">Set Up Your Fixed Expenses</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="font-medium text-sm text-text-body">Monthly Income</label>
                                <input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value) || 0)} placeholder="e.g., 5000" className="w-full mt-1" />
                            </div>
                            <div>
                                <label className="font-medium text-sm text-text-body">Household Size</label>
                                <input type="number" value={household || 1} onChange={e => setHousehold(Number(e.target.value) || 1)} placeholder="e.g., 4" className="w-full mt-1" min={1} />
                                {(!household || household <= 1) && (
                                    <p className="text-xs text-text-secondary mt-1">
                                        If you don’t add household size, we’ll treat your account as a single-person plan. You can change this later in settings.
                                    </p>
                                )}
                            </div>
                        </div>
                        <p className="text-text-secondary">
                            Add your recurring monthly costs like rent, utilities, and subscriptions to get a clear picture of your finances.
                        </p>
                        <AddExpenseForm onAdd={handleAddExpense} />
                    </div>

                    {/* Summary Panel */}
                    <div className="w-full lg:w-1/3 h-full border-t lg:border-t-0 lg:border-l border-bg-tertiary flex flex-col bg-bg-secondary">
                        <ExpenseSummary expenses={onboardingExpenses} formatCurrency={formatCurrency} onRemove={handleRemoveExpense} onFinish={() => setView('summary')} />
                    </div>
                </motion.div>
                ) : (
                <motion.div key="onboarding-summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold font-serif text-center text-text-primary">Your Financial Baseline</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="w-full h-64 md:h-80" style={{ minHeight: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="var(--brand-primary)" paddingAngle={5}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend wrapperStyle={{ color: 'var(--text-body)' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4"><Card><h3 className="font-bold text-text-primary">Summary</h3><p className="text-text-secondary mt-1">{aiSummary}</p></Card><Card><h3 className="font-bold text-text-primary">Monthly Outlook</h3><p className="text-text-secondary mt-1">{aiSurvival}</p></Card></div>
                    </div>
                    <VentyButton onClick={handleOnboardingFinish} variant="primary" className="w-full max-w-md mx-auto" label="Continue to Dashboard"></VentyButton>
                </motion.div>
                )}
        </PageLayout>
    );
};

export default OnboardingAISetupScreen;
