
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Goal, InvestmentOption } from '../types';
import PageLayout from '../components/PageLayout';
import VentyButton from '../components/VentyButton';
import { useLocalization } from '../hooks/useLocalization';
import { PlusIcon, SparklesIcon, MagnifyingGlassIcon, ArrowTrendingUpIcon, BanknotesIcon, CalendarDaysIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useToast } from '../hooks/useToast';
import Card from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';


// --- PREMIUM LOCK SCREEN ---
const PremiumLockScreen: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
    const { t } = useTranslation();
    return (
        <div className="relative h-full flex flex-col items-center justify-center text-center p-6 overflow-hidden">
            <div className="absolute inset-0 bg-bg-secondary/50 backdrop-blur-lg animate-fadeIn"></div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="relative z-10 max-w-lg">
                <SparklesIcon className="h-16 w-16 text-brand-primary mx-auto mb-4" />
                <h1 className="text-3xl lg:text-4xl font-bold font-serif text-text-primary">{t('goals.lockedTitle')}</h1>
                <p className="text-lg text-text-secondary mt-4">{t('goals.lockedSubtitle')}</p>
                <VentyButton onClick={onUpgrade} variant="primary" className="!w-auto !py-3 !px-8 mt-8 !text-lg" label={t('goals.upgradeCta')} />
            </motion.div>
        </div>
    );
};


// --- GOAL COMPONENTS ---
const AddGoalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
}> = ({ isOpen, onClose, onAddGoal }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [category, setCategory] = useState('Travel');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetAmount) {
            onAddGoal({ name, targetAmount: parseFloat(targetAmount), deadline: deadline || undefined });
            // Reset form
            setName(''); setTargetAmount(''); setCategory('Travel'); setDeadline('');
            onClose();
        }
    };
    if (!isOpen) return null;
    return (
        <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="bg-bg-primary rounded-xl shadow-lg w-full max-w-md p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <h2 className="text-xl font-bold font-serif text-center">Create a New Goal</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="font-medium text-sm">Goal Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., New Car" required className="w-full mt-1"/></div>
                        <div><label className="font-medium text-sm">Target Amount</label><input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="e.g., 25000" required className="w-full mt-1"/></div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="font-medium text-sm">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1"><option>Travel</option><option>Home</option><option>Education</option><option>Custom</option></select></div>
                        <div><label className="font-medium text-sm">Target Date (Optional)</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full mt-1"/></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <VentyButton htmlType="button" onClick={onClose} variant="secondary" label="Cancel"></VentyButton>
                        <VentyButton htmlType="submit" onClick={() => {}} label="Add Goal"></VentyButton>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const GoalCard: React.FC<{ goal: Goal; formatCurrency: (v: number) => string }> = ({ goal, formatCurrency }) => {
    const { t } = useTranslation();
    const progress = Math.max(0, Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)));
    const today = new Date().toISOString().slice(0, 10);
    const isAchieved = progress >= 100;
    const isOverdue = !!goal.deadline && goal.deadline < today && !isAchieved;
    const statusKey = isAchieved ? 'achieved' : isOverdue ? 'overdue' : 'active';
    const statusColor = isAchieved ? 'text-feedback-success' : isOverdue ? 'text-feedback-error' : 'text-brand-primary';
    const barColor = isAchieved ? 'bg-feedback-success' : isOverdue ? 'bg-feedback-error' : 'bg-brand-primary';
    return (
        <Card className="flex flex-col h-full !p-6">
            <div className="flex items-start justify-between">
                <h3 className="font-bold text-lg text-text-primary">{goal.name}</h3>
                <span className={`text-xs font-semibold ${statusColor}`}>{t(`goals.status.${statusKey}`)}</span>
            </div>
            <div className="mt-2">
                <div className="w-full bg-bg-tertiary rounded-full h-3">
                    <div className={`${barColor} h-3 rounded-full`} style={{ width: `${progress}%`, transition: 'width var(--interact-dur) var(--interact-ease)' }}></div>
                </div>
                <div className="flex justify-between text-xs font-semibold mt-2 text-text-secondary">
                    <span>{t('goals.progress.current')}: {formatCurrency(goal.currentAmount)}</span>
                    <span>{t('goals.progress.target')}: {formatCurrency(goal.targetAmount)}</span>
                </div>
                {goal.deadline && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
                        <CalendarDaysIcon className="h-4 w-4 text-brand-primary" />
                        <span>{t('goals.progress.timeframe')}: {goal.deadline}</span>
                    </div>
                )}
            </div>
        </Card>
    );
};


// --- INVESTMENT COMPONENTS ---

const riskStyles: Record<InvestmentOption['risk'], string> = {
    Low: 'bg-feedback-success/10 text-feedback-success',
    Medium: 'bg-feedback-warning/10 text-feedback-warning',
    High: 'bg-feedback-error/10 text-feedback-error',
};

const riskRates = {
    1: { worst: 0.015, avg: 0.04, best: 0.07 },  // Low Risk
    2: { worst: -0.05, avg: 0.09, best: 0.18 }, // Medium Risk
    3: { worst: -0.15, avg: 0.15, best: 0.35 }, // High Risk
};

interface SimulationDataPoint {
    year: number;
    worstCase: number;
    averageCase: number;
    bestCase: number;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <Card className="!p-2 !shadow-lg">
        <p className="font-bold text-sm mb-1">Year {label}</p>
        {payload.map((pld: any, i: number) => (
            <p key={i} className="text-xs" style={{ color: pld.stroke }}>
                {pld.name}: {formatCurrency(pld.value)}
            </p>
        ))}
      </Card>
    );
  }
  return null;
};

const PortfolioOverviewCard: React.FC = () => {
    const { formatCurrency } = useLocalization();
    const { theme } = useTheme();
    const data = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ name: `p${i}`, value: 53800 + Math.sin(i / 3) * 300 + Math.random() * 200 })), []);
    const themeColor = theme === 'dark-gold' ? '#D6AF63' : theme === 'dark-red' ? '#E53935' : '#4169E1';

    return (
        <Card className="!p-6 card-border-accent">
            <h3 className="text-xl font-bold font-serif text-text-primary">Portfolio Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
                <div className="sm:col-span-1">
                    <div>
                        <p className="text-sm text-text-secondary">Total Value</p>
                        <p className="text-2xl md:text-3xl font-bold text-text-primary">{formatCurrency(54321.98)}</p>
                    </div>
                     <div className="mt-4">
                        <p className="text-sm text-text-secondary">Today's Gain/Loss</p>
                        <p className="text-xl md:text-2xl font-bold text-feedback-success">{formatCurrency(123.45)} (+0.23%)</p>
                    </div>
                </div>
                {/* Fixed height container for sparkline with minWidth */}
                <div className="sm:col-span-2 h-32 -mb-6" style={{ minHeight: '128px' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={120} minWidth={0}>
                         <AreaChart data={data}>
                            <defs>
                                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke={themeColor} strokeWidth={2} fill="url(#portfolioGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
};

const InvestmentSimulator: React.FC<{ user: User }> = ({ user }) => {
    const { formatCurrency } = useLocalization();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const [initialAmount, setInitialAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [riskLevel, setRiskLevel] = useState(2);
    const [simulationData, setSimulationData] = useState<SimulationDataPoint[] | null>(null);
    const [summary, setSummary] = useState<{ projectedValue: number; interestEarned: number; monthlyGrowth: number } | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const runSimulation = useCallback(() => {
        const amount = parseFloat(initialAmount || '0');
        const years = parseInt(duration || '0');
        if (isNaN(amount) || amount <= 0 || isNaN(years) || years <= 0 || years > 50) {
            showToast("Please enter a valid amount and a duration up to 50 years.");
            return;
        }

        setIsSimulating(true);
        setTimeout(() => {
            const rates = riskRates[riskLevel as keyof typeof riskRates];
            const data: SimulationDataPoint[] = [];
            for (let i = 0; i <= years; i++) {
                const compound = (rate: number) => amount * Math.pow(1 + rate, i);
                data.push({
                    year: i,
                    worstCase: compound(rates.worst),
                    averageCase: compound(rates.avg),
                    bestCase: compound(rates.best),
                });
            }
            setSimulationData(data);

            const finalProjected = data[data.length - 1].averageCase;
            const interest = finalProjected - amount;
            const monthlyGrowth = Math.pow(1 + rates.avg, 1 / 12) - 1;
            setSummary({ projectedValue: finalProjected, interestEarned: interest, monthlyGrowth: monthlyGrowth });
            setIsSimulating(false);
        }, 800);
    }, [initialAmount, duration, riskLevel, showToast]);

    const riskLabels = ['Low', 'Medium', 'High'];
    const themeColors = {
        light: { worst: '#ef4444', avg: '#3A7BFF', best: '#22c55e' },
        dark: { worst: '#f87171', avg: '#D6AF63', best: '#4ade80' },
        trader: { worst: '#fca5a5', avg: '#E53935', best: '#a7f3d0' },
    };
    const currentColors = themeColors[theme];
    
    return (
        <>
            <Card className="!p-6 card-border-accent">
                <h2 className="text-xl md:text-2xl font-bold font-serif mb-4 flex items-center gap-2 text-text-primary"><SparklesIcon className="h-6 w-6 text-brand-primary"/>Investment Simulator</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="md:col-span-3 lg:col-span-1">
                        <label className="font-medium text-sm text-text-secondary flex items-center gap-2 mb-1"><BanknotesIcon className="h-4 w-4 text-brand-primary"/>Initial Investment ({user.currency})</label>
                        <input type="number" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} className="w-full text-lg"/>
                    </div>
                    <div className="md:col-span-3 lg:col-span-1">
                         <label className="font-medium text-sm text-text-secondary flex items-center gap-2 mb-1"><CalendarDaysIcon className="h-4 w-4 text-brand-primary"/>Duration (Years)</label>
                        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full text-lg"/>
                    </div>
                     <div className="md:col-span-3 lg:col-span-1">
                        <label className="font-medium text-sm text-text-secondary flex items-center gap-2 mb-1"><ArrowTrendingUpIcon className="h-4 w-4 text-brand-primary"/>Risk Level: <span className="font-bold text-brand-primary">{riskLabels[riskLevel-1]}</span></label>
                        <input type="range" min="1" max="3" value={riskLevel} onChange={e => setRiskLevel(parseInt(e.target.value))} className="risk-slider mt-3"/>
                    </div>
                </div>
                <div className="mt-6 border-t border-border-primary pt-4 flex flex-col sm:flex-row gap-4">
                    <VentyButton onClick={runSimulation} disabled={isSimulating || !initialAmount || !duration} className="!w-full sm:!w-auto sm:px-8" label={isSimulating ? 'Calculating...' : 'Run Simulation'}/>
                </div>
            </Card>

            <AnimatePresence>
            {simulationData && summary && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 !p-6">
                        <h3 className="font-bold mb-4 text-text-primary text-lg">Projected Growth</h3>
                        {/* Robust chart container for simulation results */}
                        <div className="w-full h-[300px] md:h-[400px]" style={{ minHeight: 300 }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                                <AreaChart data={simulationData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)"/><XAxis dataKey="year" name="Year" stroke="var(--text-secondary)"/><YAxis stroke="var(--text-secondary)" tickFormatter={v => formatCurrency(v)}/>
                                    <RechartsTooltip content={<CustomTooltip formatCurrency={formatCurrency} />}/>
                                    <Area type="monotone" dataKey="worstCase" name="Worst Case" fill={currentColors.worst} fillOpacity={0.1} stroke={currentColors.worst} strokeWidth={2} />
                                    <Area type="monotone" dataKey="bestCase" name="Best Case" fill={currentColors.best} fillOpacity={0.1} stroke={currentColors.best} strokeWidth={2} />
                                    <Area type="monotone" dataKey="averageCase" name="Expected" fill={currentColors.avg} fillOpacity={0.2} stroke={currentColors.avg} strokeWidth={3}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                     <div className="space-y-6">
                        <Card className="flex flex-col justify-center h-full !p-6">
                            <h3 className="font-bold mb-4 text-text-primary text-lg">Simulation Results</h3>
                            <div className="space-y-5">
                                <div><p className="text-text-secondary text-sm">Total Projected Value</p><p className="text-2xl md:text-3xl font-bold text-text-primary">{formatCurrency(summary.projectedValue)}</p></div>
                                <div><p className="text-text-secondary text-sm">Interest Earned</p><p className="text-xl md:text-2xl font-bold text-feedback-success">{formatCurrency(summary.interestEarned)}</p></div>
                                <div><p className="text-text-secondary text-sm">Avg. Monthly Growth</p><p className="text-xl md:text-2xl font-bold text-text-primary">{summary.monthlyGrowth.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 })}</p></div>
                            </div>
                            <VentyButton onClick={() => showToast('Goal saved!')} variant="secondary" className="w-full mt-6 !text-sm flex items-center justify-center gap-2"><CheckIcon className="h-4 w-4"/>Save Result as a Goal</VentyButton>
                        </Card>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
};

const InvestmentRow: React.FC<{ option: InvestmentOption; formatCurrency: (v: number) => string }> = React.memo(({ option, formatCurrency }) => (
    <div className="flex items-center justify-between p-3 my-1.5 rounded-xl transition-colors bg-bg-secondary hover:bg-bg-tertiary border border-border-primary shadow-sm">
        <div className="flex items-center space-x-4 overflow-hidden">
            <img src={option.imageUrl} alt={option.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
            <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{option.name} ({option.ticker})</p>
                <p className="text-xs text-text-secondary truncate">{option.sector}</p>
            </div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0 ml-2">
            <div className="text-center hidden sm:block">
                 <p className="text-xs text-text-secondary">YTD</p>
                 <p className={`font-semibold text-sm ${option.ytdReturn >= 0 ? 'text-feedback-success' : 'text-feedback-error'}`}>{option.ytdReturn.toFixed(1)}%</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(option.price)}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskStyles[option.risk]}`}>{option.risk}</span>
            </div>
        </div>
    </div>
));

const InvestmentTipsPanel: React.FC = () => {
    const { formatCurrency } = useLocalization();
    const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        return [];
    }, [riskFilter, searchTerm]);

    return (
        <Card className="!p-6 !bg-bg-primary dark:!bg-bg-tertiary card-border-accent" style={{boxShadow: '0 4px 14px rgba(0,0,0,0.08)'}}>
            <h2 className="text-xl md:text-2xl font-bold font-serif mb-4 text-text-primary">Investment Opportunities ({filteredOptions.length})</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative md:col-span-2">
                     <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary"/>
                     <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or ticker..." className="w-full pl-12"/>
                </div>
                <div className="flex bg-bg-secondary rounded-lg p-1">
                    {(['All', 'Low', 'Medium', 'High'] as const).map(risk => (
                        <button key={risk} onClick={() => setRiskFilter(risk)} className={`w-1/4 py-1.5 rounded-md font-semibold transition-colors text-sm ${riskFilter === risk ? 'bg-bg-primary shadow text-text-primary' : 'text-text-secondary'}`}>{risk}</button>
                    ))}
                </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2">
                {filteredOptions.length > 0 ? filteredOptions.map(option => (
                    <InvestmentRow key={option.id} option={option} formatCurrency={formatCurrency} />
                )) : <p className="text-center text-text-secondary py-8">No investments match your criteria.</p>}
            </div>
        </Card>
    );
};


// --- MAIN SCREEN COMPONENT ---
interface GoalsScreenProps {
    user: User;
    isPremium: boolean;
    onUpgrade: () => void;
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const GoalsScreen: React.FC<GoalsScreenProps> = ({ user, isPremium, onUpgrade, goals, setGoals }) => {
    const { formatCurrency } = useLocalization();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const handleAddGoal = (newGoalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        const newGoal: Goal = { id: `goal-${Date.now()}`, currentAmount: 0, ...newGoalData };
        setGoals(prev => [...prev, newGoal]);
        showToast(`Goal "${newGoal.name}" added!`);
    };
    
    if (!isPremium) {
        return <PageLayout title={t('goals.title')}><PremiumLockScreen onUpgrade={onUpgrade} /></PageLayout>;
    }

    return (
        <PageLayout title={t('goals.title')}>
            <AddGoalModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddGoal={handleAddGoal} />
            <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold font-serif">My Aspirations</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-bg-secondary rounded-lg p-1">
                            <button className="px-3 py-1.5 rounded-md font-semibold bg-bg-primary shadow text-text-primary">Goals</button>
                            <button onClick={() => window.location.hash = '#/goals/invest'} className="px-3 py-1.5 rounded-md font-semibold text-text-secondary hover:text-text-primary">Invest</button>
                        </div>
                        <VentyButton onClick={() => setIsAddModalOpen(true)} className="!w-auto !py-2 !px-4" label={<><PlusIcon className="h-5 w-5 mr-2"/>{t('goals.addNew')}</>} />
                    </div>
                </div>

                {goals.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {goals.map(g => <GoalCard key={g.id} goal={g} formatCurrency={formatCurrency} />)}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <p className="text-text-secondary">No goals set yet.</p>
                        <p className="text-xs text-text-tertiary mt-1">Start by adding your first financial dream!</p>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
};

export default GoalsScreen;
