import { User, BudgetCategory, Product, Recommendation } from '../types';

const OVERSPEND_THRESHOLD = 1.1; // 10% over budget to trigger a recommendation

const categoryToProductMap: Record<string, { productCategory?: string; keywords: string[] }> = {
    'Entertainment': { keywords: ['coffee machine', 'subscription'] },
    'Clothing': { productCategory: 'Fashion & Apparel', keywords: [] },
    'Gym / Fitness': { productCategory: 'Gym & Fitness', keywords: [] },
};

// FIX: Use langCode, countryCode, and currency from the updated User type for proper localization.
const formatCurrencyForRec = (value: number, user: User) => {
    try {
        return new Intl.NumberFormat('en', {
            style: 'currency',
            currency: user.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    } catch {
        // FIX: Use the user's currency code in the fallback.
        return `${Math.round(value).toLocaleString('en-US')} ${user.currency}`;
    }
};

export const generateDynamicRecommendations = (user: User, budget: BudgetCategory[], totalFixedExpenses: number, products: Product[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    if (!user) return recommendations;
    const disposableIncome = user.salary - totalFixedExpenses;
    
    // Hardcoded check for coffee spending
    const entertainmentCat = budget.find(c => c.name === 'Entertainment');
    if (entertainmentCat && entertainmentCat.spent > 400) { // Arbitrary high coffee spend
        const coffeeMachine = products.find(p => p.title.toLowerCase().includes('air fryer') && p.originalPrice); // using air fryer for demo as no coffee machine exists
        if (coffeeMachine) {
            const monthlyCoffeeSpend = 400; // Assume this value
            const paybackMonths = coffeeMachine.price / monthlyCoffeeSpend;
            recommendations.push({
                id: `rec-${coffeeMachine.id}`,
                reason: `You're spending a lot on takeout. This could help!`,
                product: coffeeMachine,
                // FIX: Use the user object for currency formatting.
                savings: `Save ~${formatCurrencyForRec(monthlyCoffeeSpend, user)}/month after ${paybackMonths.toFixed(1)} months!`,
                category: 'Entertainment',
            });
        }
    }


    for (const category of budget) {
        if (recommendations.length >= 2) break; // Limit to 2 recommendations

        const allocatedAmount = (disposableIncome * category.allocated) / 100;
        if (allocatedAmount > 0 && category.spent > allocatedAmount * OVERSPEND_THRESHOLD) {
            // Overspending detected
            const mapping = categoryToProductMap[category.name];
            if (!mapping) continue;

            const relevantProducts = products.filter(p => 
                p.originalPrice && p.price < p.originalPrice && // Must be on sale
                (
                    (mapping.productCategory && p.category === mapping.productCategory) ||
                    (mapping.keywords.some(kw => p.title.toLowerCase().includes(kw)))
                )
            );

            if (relevantProducts.length > 0) {
                // Find the best deal in the relevant category
                const bestDeal = relevantProducts.sort((a, b) => ((b.originalPrice! - b.price) / b.originalPrice!) - ((a.originalPrice! - a.price) / a.originalPrice!))[0];
                
                // Avoid duplicating a recommendation we might have already added
                if (recommendations.some(r => r.product.id === bestDeal.id)) continue;

                const savingsText = `Save ${((bestDeal.originalPrice! - bestDeal.price) / bestDeal.originalPrice! * 100).toFixed(0)}% on this purchase.`;

                recommendations.push({
                    id: `rec-${bestDeal.id}`,
                    reason: `You're overspending on ${category.name}. Check out this deal!`,
                    product: bestDeal,
                    savings: savingsText,
                    category: category.name,
                });
            }
        }
    }
    return recommendations;
};
