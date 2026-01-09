
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BudgetCategory, FixedExpense } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import Card from './Card';
import VentyButton from './VentyButton';
import SpendingForecastChart from './SpendingForecastChart';
import { sortBudgetItems } from '../utils/budgetManager';

interface BudgetPanelProps {
    user: User;
    budget: BudgetCategory[];
    fixedExpenses: FixedExpense[];
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const BudgetPanel: React.FC<BudgetPanelProps> = ({ user, budget, fixedExpenses }) => {
    const navigate = useNavigate();
    const { formatCurrency } = useLocalization();

    const { budgetItems, totalBudgeted, totalIncomeForBudget } = useMemo(() => {
        const totalFixed = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
        const incomeForBudget = user.salary - totalFixed;
        
        const enhancedItems = budget.map((item, index) => ({
            ...item,
            amount: (incomeForBudget * item.allocated) / 100,
            priority: (['High', 'Medium', 'Low'][index % 3] as 'High' | 'Medium' | 'Low') || 'Medium',
        }));
        
        const sortedItems = sortBudgetItems(enhancedItems);
        const totalAllocated = sortedItems.reduce((sum, item) => sum + item.amount, 0);

        return { budgetItems: sortedItems, totalBudgeted: totalAllocated, totalIncomeForBudget: incomeForBudget };
    }, [user.salary, budget, fixedExpenses]);

    const remainingToAllocate = totalIncomeForBudget - totalBudgeted;

    return (
        <motion.div 
            variants={itemVariants as any} 
            className="space-y-5"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1 } as any}
        >
            <motion.div variants={itemVariants as any}>
                <SpendingForecastChart formatCurrency={formatCurrency} />
            </motion.div>
            
            <motion.div variants={itemVariants as any}>
                <Card>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Top Spending</h2>
                        <VentyButton onClick={() => navigate('/budget')} variant="secondary" className="!w-auto !py-1.5 !px-3 !text-sm">Manage</VentyButton>
                    </div>
                    <div className="space-y-4">
                        {budgetItems.slice(0, 5).map(item => {
                            const progress = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
                            return (
                                <div key={item.id}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <p className="font-semibold">{item.icon} {item.name}</p>
                                        <p className="font-medium">{formatCurrency(item.spent)} / <span className="text-text-secondary">{formatCurrency(item.amount)}</span></p>
                                    </div>
                                    <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-brand-primary" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                         {remainingToAllocate > 0 && (
                            <div className="text-center pt-4 mt-4 border-t border-border-primary">
                                <p className="text-sm font-semibold text-feedback-success">{formatCurrency(remainingToAllocate)} still unallocated!</p>
                            </div>
                         )}
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default BudgetPanel;
