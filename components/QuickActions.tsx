import React, { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MinusCircleIcon, ArrowUpCircleIcon, ChartPieIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { BudgetCategory, ExpenseData, IncomeData } from '../types';
import VentyButton from './VentyButton';
import { useLocalization } from '../hooks/useLocalization';

// --- PROPS ---
interface QuickActionsProps {
    budgetCategories: BudgetCategory[];
    onAddExpense: (data: ExpenseData) => void;
    onAddIncome: (data: IncomeData) => void;
}

// --- MOTION VARIANTS ---
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
} as any;

const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } },
} as any;

// --- ACTION BUTTON ---
const ActionButton: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    colorClasses: string;
}> = ({ icon: Icon, label, onClick, colorClasses }) => (
    <motion.button
        onClick={onClick}
        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl font-semibold transition-all ${colorClasses}`}
        whileHover={{ scale: 1.05, filter: 'brightness(0.97)' } as any}
        whileTap={{ scale: 0.95 } as any}
    >
        <Icon className="h-6 w-6 sm:h-8 sm:h-8" />
        <span className="text-sm">{label}</span>
    </motion.button>
);


// --- MODAL ---
interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                className="fixed inset-0 modal-backdrop backdrop-blur-sm flex justify-center items-center p-4 z-50"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={backdropVariants}
                onClick={onClose}
            >
                <motion.div
                    className="bg-ui-background rounded-xl shadow-lg w-full max-w-md p-6"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-serif">{title}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-ui-border">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- FORMS ---
const todayISO = new Date().toISOString().split('T')[0];

const ExpenseForm: React.FC<{
    categories: BudgetCategory[];
    onSubmit: (data: ExpenseData) => void;
    onClose: () => void;
}> = ({ categories, onSubmit, onClose }) => {
    const {} = useLocalization() as any;
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');
    const [date, setDate] = useState(todayISO);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const n = Number(amount);
        if (!Number.isFinite(n) || n <= 0) { setError('Enter a valid amount greater than 0'); return; }
        if (!category || !category.trim()) { setError('Select a category'); return; }
        setError(null);
        onSubmit({
            amount: n,
            category: category.trim(),
            date,
            notes,
            expType: 'variable',
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="font-medium text-sm">Amount</label>
                <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"/>
            </div>
            <div>
                <label className="font-medium text-sm">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border">
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
            </div>
            <div>
                <label className="font-medium text-sm">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"/>
            </div>
            <div>
                <label className="font-medium text-sm">Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Lunch with colleagues" className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"></textarea>
            </div>
            {error && <p className="text-xs text-feedback-error bg-feedback-error-bg rounded px-2 py-1">{error}</p>}
            <VentyButton onClick={() => {}}>Add Expense</VentyButton>
        </form>
    );
};

const IncomeForm: React.FC<{
    onSubmit: (data: IncomeData) => void;
    onClose: () => void;
}> = ({ onSubmit, onClose }) => {
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [date, setDate] = useState(todayISO);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !source) return;
        onSubmit({
            amount: parseFloat(amount),
            source,
            date,
            notes,
            recurring: false,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="font-medium text-sm">Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"/>
            </div>
            <div>
                <label className="font-medium text-sm">Source</label>
                <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g., Freelance Project" required className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"/>
            </div>
            <div>
                <label className="font-medium text-sm">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"/>
            </div>
            <div>
                <label className="font-medium text-sm">Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Final payment for website design" className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"></textarea>
            </div>
            <VentyButton onClick={() => {}}>Add Income</VentyButton>
        </form>
    );
};


// --- MAIN COMPONENT ---
const QuickActions: React.FC<QuickActionsProps> = ({ budgetCategories, onAddExpense, onAddIncome }) => {
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [incomeModalOpen, setIncomeModalOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="animate-cinematic-enter">
            <h2 className="text-xl sm:text-2xl font-bold font-serif mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-4">
                <ActionButton
                    label="Add Expense"
                    icon={MinusCircleIcon}
                    onClick={() => setExpenseModalOpen(true)}
                    colorClasses="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                />
                <ActionButton
                    label="Add Income"
                    icon={ArrowUpCircleIcon}
                    onClick={() => setIncomeModalOpen(true)}
                    colorClasses="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300"
                />
                <ActionButton
                    label="View Budget"
                    icon={ChartPieIcon}
                    onClick={() => navigate('/budget')}
                    colorClasses="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                />
            </div>

            <ActionModal
                isOpen={expenseModalOpen}
                onClose={() => setExpenseModalOpen(false)}
                title="Add New Expense"
            >
                <ExpenseForm
                    categories={budgetCategories}
                    onSubmit={onAddExpense}
                    onClose={() => setExpenseModalOpen(false)}
                />
            </ActionModal>

            <ActionModal
                isOpen={incomeModalOpen}
                onClose={() => setIncomeModalOpen(false)}
                title="Add New Income"
            >
                <IncomeForm
                    onSubmit={onAddIncome}
                    onClose={() => setIncomeModalOpen(false)}
                />
            </ActionModal>
        </div>
    );
};

export default memo(QuickActions);
