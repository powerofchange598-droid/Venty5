import { User, Transaction, SmartNotification } from '../types';
import { safeDate } from './dateUtils';

// Helper to format currency consistently within tips
const formatCurrencyForTip = (value: number, currency: string, langCode: string) => {
    try {
        return new Intl.NumberFormat('en', {
            style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(value);
    } catch {
        return `${Math.round(value).toLocaleString('en-US')} ${currency}`;
    }
}

/**
 * A tiny, on-device rule engine to generate personalized financial notifications.
 * @param user The current user object.
 * @param transactions The user's recent transactions.
 * @returns An array of up to 3 personalized SmartNotification objects.
 */
export const generateSmartNotifications = (
    user: User,
    transactions: Transaction[]
): SmartNotification[] => {
    const generatedNotifications: SmartNotification[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentExpenses = transactions.filter(t => {
        const d = safeDate(t.date);
        return t.type === 'expense' && d && d > sevenDaysAgo;
    });

    // --- NEW: Add event-based notifications first ---
    const incomeTx = transactions.find(t => {
        const d = safeDate(t.date);
        return t.type === 'income' && t.description !== 'Monthly Salary' && d && d > sevenDaysAgo;
    });
    if (incomeTx) {
        generatedNotifications.push({
            id: 'event_new_tx',
            icon: '⚡',
            type: 'tip',
            title: `New Transaction`,
            message: `You received ${formatCurrencyForTip(incomeTx.amount, user.currency, user.langCode)} from ${incomeTx.description}.`,
            date: now.toISOString(),
            read: false,
        });
    }

    generatedNotifications.push({
        id: 'event_report_ready',
        icon: '💳',
        type: 'tip',
        title: 'Weekly Report Ready',
        message: 'Your weekly spending summary is available. Take a look to see where your money went!',
        date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        read: true, // Mark as read to not be too intrusive
    });

    // Rule 1: High spending on "Food" or "Groceries"
    const foodExpenses = recentExpenses
        .filter(t => t.category.toLowerCase().includes('food') || t.category.toLowerCase().includes('groceries'))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Assume weekly food budget is ~25% of monthly salary (a rough proxy)
    const weeklyFoodBudgetThreshold = (user.salary * 0.25) / 4; 

    if (foodExpenses > weeklyFoodBudgetThreshold && generatedNotifications.length < 4) {
        generatedNotifications.push({
            id: 'ai_food_overspend',
            icon: '🛒',
            type: 'ai_suggestion',
            title: 'Food Spending Alert',
            message: `You've spent ${formatCurrencyForTip(foodExpenses, user.currency, user.langCode)} on food this week. Consider setting a specific budget to stay on track.`,
            date: now.toISOString(),
            read: false,
        });
    }

    // Rule 2: Rapid balance drop
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const rapidSpending = recentExpenses
        .filter(t => {
            const d = safeDate(t.date);
            return d && d > threeDaysAgo;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Threshold: 10% of monthly salary in 3 days
    if (rapidSpending > user.salary * 0.1 && generatedNotifications.length < 4) {
        generatedNotifications.push({
            id: 'ai_rapid_spend',
            icon: '⚠️',
            type: 'alert',
            title: 'High Recent Spending',
            message: `Your expenses seem high over the last 3 days. Would you like to review your goals?`,
            date: now.toISOString(),
            read: false,
        });
    }

    // Rule 3: Increased income/savings
    const recentIncome = transactions
        .filter(t => {
            const d = safeDate(t.date);
            return t.type === 'income' && d && d > sevenDaysAgo;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    // If income this week is more than 25% of monthly salary (e.g., a bonus)
    if (recentIncome > user.salary * 0.25 && generatedNotifications.length < 4) {
        generatedNotifications.push({
            id: 'ai_income_boost',
            icon: '🎉',
            type: 'tip',
            title: 'Income Boost!',
            message: `Amazing progress! You've received extra income this month. A great time to boost your savings.`,
            date: now.toISOString(),
            read: false,
        });
    }

    // Generic fallback tip if no specific rules match
    if (generatedNotifications.length === 0) {
        generatedNotifications.push({
            id: 'ai_generic_review',
            icon: '💡',
            type: 'tip',
            title: 'Weekly Review',
            message: "It's a good time to review your weekly spending and see where you can save.",
            date: now.toISOString(),
            read: false,
        });
    }
    
    // Sort by date descending
    return generatedNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
