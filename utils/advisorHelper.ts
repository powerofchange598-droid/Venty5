import { User, BudgetCategory } from '../types';

export interface InvestmentNudge {
    categoryName: string;
    categoryEmoji: string;
    cutPercentage: number;
    potentialSaving: number;
    suggestedInvestment: {
        name: string;
        category: string;
    };
}

const getSimpleInvestmentSuggestion = (): { name: string; category: string } | null => {
    return null;
};

export const generateInvestmentNudge = (user: User, budget: BudgetCategory[]): InvestmentNudge | null => {
    // Find the highest spending category that is not 'Savings'
    const highSpendingCategory = [...budget]
        .filter(cat => cat.name !== 'Savings' && cat.spent > 0)
        .sort((a, b) => b.spent - a.spent)[0];

    if (!highSpendingCategory || highSpendingCategory.spent < 200) { // Don't generate if spending is too low
        return null;
    }

    const cutPercentage = 5; // A small, achievable percentage
    const potentialSaving = Math.round(highSpendingCategory.spent * (cutPercentage / 100));

    if (potentialSaving < 10) { // Don't generate if savings are negligible
        return null;
    }

    const suggestedInvestment = getSimpleInvestmentSuggestion();

    if (!suggestedInvestment) return null;

    return {
        categoryName: highSpendingCategory.name,
        categoryEmoji: highSpendingCategory.icon,
        cutPercentage,
        potentialSaving,
        suggestedInvestment,
    };
};
