import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, BudgetCategory, FixedExpense, Transaction, Goal } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import PageLayout from '../components/PageLayout';
import { ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SparklesIcon, BellIcon } from '@heroicons/react/24/solid';
import Card from '../components/Card';

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const CustomTooltip: React.FC<any> = ({ active, payload, label, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-[#333] text-white rounded-lg border border-transparent shadow-lg">
        <p className="font-bold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => {
              const valueText = pld.dataKey === 'allocated' ? `Budget: ${formatCurrency(pld.value)}` : 
                                pld.dataKey === 'spent' ? `Spent: ${formatCurrency(pld.value)}` :
                                `${pld.name}: ${formatCurrency(pld.value)}`;
              return (
                  <div key={pld.dataKey} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.fill }}></div>
                      <span>{valueText}</span>
                  </div>
              );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const KPICard: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <motion.div variants={itemVariants}>
        <Card>
            <p className="text-text-secondary text-sm font-medium">{label}</p>
            <p className="text-2xl md:text-3xl font-bold text-text-primary mt-1">{value}</p>
        </Card>
    </motion.div>
);

interface FinancialSnapshotScreenProps {
    user: User;
    budget: BudgetCategory[];
    fixedExpenses: FixedExpense[];
    transactions: Transaction[];
    goals: Goal[];
}

const FinancialSnapshotScreen: React.FC<FinancialSnapshotScreenProps> = ({ user, budget, fixedExpenses, transactions, goals }) => {
    const { formatCurrency } = useLocalization();

    const { financialData, categorySpendingData, aiInsight } = useMemo(() => {
        const totalIncome = user.salary;
        const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const disposableIncome = totalIncome - totalFixed;
        const totalVariable = budget.reduce((sum, c) => sum + c.spent, 0);
        const totalSpent = totalFixed + totalVariable;
        
        const savings = totalIncome - totalSpent;
        const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
        
        const essentialCats = ['Groceries', 'Transport', 'Health', 'Education', 'Housing'];
        const essentialSpending = budget.filter(c => essentialCats.includes(c.name)).reduce((sum, c) => sum + c.spent, 0) + totalFixed;
        const nonEssentialSpending = budget.filter(c => !essentialCats.includes(c.name)).reduce((sum, c) => sum + c.spent, 0);
        const essentialsRatio = nonEssentialSpending > 0 ? (essentialSpending / nonEssentialSpending) : 0;

        const finData = {
            savingsRate: `${savingsRate.toFixed(1)}%`,
            essentialsRatio: `${essentialsRatio.toFixed(1)} : 1`,
            remainingCash: formatCurrency(savings),
        };
        
        const catSpendingData = budget
            .map(cat => {
                const allocated = disposableIncome > 0 ? (disposableIncome * cat.allocated) / 100 : 0;
                return { 
                    name: `${cat.icon} ${cat.name}`, 
                    spent: cat.spent, 
                    allocated,
                    isOverspent: cat.spent > allocated && allocated > 0,
                };
            })
            .filter(c => c.spent > 0 || c.allocated > 0)
            .sort((a, b) => b.spent - a.spent);
            
        const overspent = catSpendingData.filter(c => c.isOverspent);
        
        let insight;
        if (overspent.length > 0) {
            insight = `You're overspending in '${overspent[0].name.trim()}'. Consider reviewing this category to find potential savings.`;
        } else if (savingsRate < 10 && (totalIncome > 0)) {
            insight = "Your budget is a bit tight, with a savings rate under 10%. Let's look for opportunities to increase your savings next month.";
        } else if (totalIncome > 0) {
            insight = "Your savings rate is fantastic! You're managing your finances well. Consider investing this surplus to accelerate your goals.";
        } else {
            insight = "Add your income and set your budget categories to unlock personalized insights.";
        }
        
        return {
            financialData: finData,
            categorySpendingData: catSpendingData.slice(0, 5),
            aiInsight: insight
        };
    }, [user, budget, fixedExpenses, formatCurrency]);
    
    const expenseTrendData = useMemo(() => {
      const months: { month: string; expenses: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('en', { month: 'short' });
        const sum = transactions
          .filter(t => t.type !== 'income')
          .filter(t => {
            const td = new Date(t.date || Date.now());
            return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
          })
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        months.push({ month: label, expenses: sum });
      }
      return months;
    }, [transactions]);

    const UpcomingItemsCard: React.FC<{ expenses: FixedExpense[], goals: Goal[] }> = ({ expenses, goals }) => {
        const topGoal = goals.sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];
        return (
            <Card>
                <h3 className="font-semibold text-text-primary mb-4">On the Horizon</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><BellIcon className="h-4 w-4 text-brand-primary"/>Upcoming Bills</h4>
                        <div className="space-y-2">
                        {expenses.slice(0, 2).map(exp => (
                            <div key={exp.id} className="flex justify-between items-center text-sm">
                                <p>{exp.icon} {exp.name}</p>
                                <p className="font-medium">{formatCurrency(exp.amount)}</p>
                            </div>
                        ))}
                        {expenses.length === 0 && <p className="text-sm text-text-secondary">No upcoming bills logged.</p>}
                        </div>
                    </div>
                    {topGoal && (
                        <div className="pt-4 border-t border-border-primary">
                             <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><SparklesIcon className="h-4 w-4 text-brand-primary"/>Top Goal</h4>
                             <div className="text-sm">
                                <p className="font-medium">{topGoal.name}</p>
                                <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-1">
                                    <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${(topGoal.currentAmount / topGoal.targetAmount) * 100}%` }}></div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <PageLayout title="Spending Insights">
            <motion.div 
                className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {user.salary > 0 && (fixedExpenses.length > 0 || budget.length > 0) && (
                  <KPICard label="Monthly Savings Rate" value={financialData.savingsRate} />
                )}
                {(budget.length > 0 || fixedExpenses.length > 0) && (
                  <KPICard label="Essential vs. Non-essential" value={financialData.essentialsRatio} />
                )}
                {user.salary > 0 && (fixedExpenses.length > 0 || budget.length > 0) && (
                  <KPICard label="Remaining Cash" value={financialData.remainingCash} />
                )}
                {!(user.salary > 0 && (fixedExpenses.length > 0 || budget.length > 0)) && (
                  <motion.div variants={itemVariants}>
                    <Card>
                      <p className="text-text-secondary text-sm font-medium">Get Started</p>
                      <p className="text-text-primary mt-1">Add your income and bills to see savings and insights.</p>
                    </Card>
                  </motion.div>
                )}
                
                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-4">
                    <Card>
                        <h3 className="font-semibold text-text-primary mb-4">Expense Trend (6 Months)</h3>
                        {/* Responsive chart container */}
                        <div className="w-full h-[300px] md:h-[400px]" style={{ minHeight: 300 }}>
                            {expenseTrendData.some(d => d.expenses > 0) ? (
                              <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                                  <AreaChart data={expenseTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                      <defs><linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/></linearGradient></defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                      <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                      <YAxis tickFormatter={(val) => formatCurrency(val)} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                      <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--brand-primary)" fill="url(#colorExpenses)" strokeWidth={2} />
                                  </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-center">
                                <div>
                                  <p className="text-lg font-semibold">No transactions yet</p>
                                  <p className="text-text-secondary mt-1">Add your expenses to see monthly trends.</p>
                                </div>
                              </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
                
                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                     <Card>
                        <h3 className="font-semibold text-text-primary mb-4">Budget vs. Actual Spending</h3>
                         {/* Responsive chart container for Bar Chart */}
                         <div className="w-full h-[400px] md:h-[500px]" style={{ minHeight: 400 }}>
                            {categorySpendingData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
                                  <ComposedChart data={categorySpendingData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" horizontal={false} />
                                      <XAxis type="number" tickFormatter={(val) => formatCurrency(val)} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                      <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                      <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} cursor={{ fill: 'var(--bg-tertiary)' }}/>
                                      <Legend />
                                      <Bar dataKey="allocated" name="Budget" fill="var(--brand-primary)" radius={[4, 4, 4, 4]} barSize={10} />
                                      <Bar dataKey="spent" name="Spent" radius={[4, 4, 4, 4]} barSize={10}>
                                          {categorySpendingData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={entry.isOverspent ? 'var(--feedback-error)' : '#FFA756'} />
                                          ))}
                                      </Bar>
                                  </ComposedChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-center">
                                <div>
                                  <p className="text-lg font-semibold">No budget categories yet</p>
                                  <p className="text-text-secondary mt-1">Add categories and allocations to compare against actual spending.</p>
                                </div>
                              </div>
                            )}
                         </div>
                    </Card>
                </motion.div>
                
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <UpcomingItemsCard expenses={fixedExpenses} goals={goals} />
                </motion.div>

                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-4">
                    <Card>
                         <div className="flex items-start space-x-3">
                            <SparklesIcon className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-text-primary mb-1">AI Insight</h3>
                                <p className="text-text-secondary">{aiInsight}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </PageLayout>
    );
};

export default FinancialSnapshotScreen;
