import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, InvestmentOption } from '../types';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { useLocalization } from '../hooks/useLocalization';
import { SparklesIcon, MagnifyingGlassIcon, ArrowTrendingUpIcon, BanknotesIcon, CalendarDaysIcon, CheckIcon } from '@heroicons/react/24/solid';
import UpgradeBanner from '../components/UpgradeBanner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';

const riskStyles: Record<InvestmentOption['risk'], string> = {
    Low: 'bg-feedback-success/10 text-feedback-success',
    Medium: 'bg-feedback-warning/10 text-feedback-warning',
    High: 'bg-feedback-error/10 text-feedback-error',
};

const riskRates = {
    1: { worst: 0.015, avg: 0.04, best: 0.07 },
    2: { worst: -0.05, avg: 0.09, best: 0.18 },
    3: { worst: -0.15, avg: 0.15, best: 0.35 },
};

interface SimulationDataPoint {
    year: number;
    worstCase: number;
    averageCase: number;
    bestCase: number;
}

const InvestmentRow: React.FC<{ option: InvestmentOption; formatCurrency: (v: number) => string; onSimulate: (opt: InvestmentOption) => void }> = React.memo(({ option, formatCurrency, onSimulate }) => (
    <div className="flex items-center justify-between p-3 my-1.5 rounded-xl transition-all duration-200 bg-bg-secondary hover:bg-bg-tertiary border border-border-primary shadow-sm hover:shadow-md hover:-translate-y-px">
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
            <button onClick={() => onSimulate(option)} className="ml-3 px-3 py-1.5 rounded-md text-xs font-semibold bg-brand-primary text-brand-on-primary hover:brightness-110">Simulate</button>
        </div>
    </div>
));

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

interface InvestmentScreenProps {
    user: User;
    isPremiumUser: boolean;
}

const InvestmentScreen: React.FC<InvestmentScreenProps> = ({ user, isPremiumUser }) => {
    const { formatCurrency } = useLocalization();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const [initialAmount, setInitialAmount] = useState('10000');
    const [duration, setDuration] = useState('10');
    const [riskLevel, setRiskLevel] = useState(2);
    const [simulationData, setSimulationData] = useState<SimulationDataPoint[] | null>(null);
    const [summary, setSummary] = useState<{ projectedValue: number; interestEarned: number; monthlyGrowth: number } | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOption, setSelectedOption] = useState<InvestmentOption | null>(null);
    const simulatorRef = useRef<HTMLDivElement | null>(null);

    const runSimulation = useCallback(() => {
        const amount = parseFloat(initialAmount);
        const years = parseInt(duration);
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
            setSummary({ projectedValue: finalProjected, interestEarned: interest, monthlyGrowth });
            setIsSimulating(false);
        }, 800);
    }, [initialAmount, duration, riskLevel, showToast]);

    useEffect(() => { runSimulation(); }, []);

    const riskLabels = ['Low', 'Medium', 'High'];
    const themeColors = {
        light: { worst: '#ef4444', avg: '#3A7BFF', best: '#22c55e' },
        dark: { worst: '#f87171', avg: '#D6AF63', best: '#4ade80' },
        trader: { worst: '#fca5a5', avg: '#E53935', best: '#a7f3d0' },
    } as const;
    const currentColors = themeColors[theme as keyof typeof themeColors];

    const filteredOptions = useMemo(() => {
        return [];
    }, [riskFilter, searchTerm]);

    const handleSimulateOption = useCallback((opt: InvestmentOption) => {
        setSelectedOption(opt);
        setInitialAmount('10000');
        setDuration('10');
        const riskMap: Record<'Low' | 'Medium' | 'High', number> = { Low: 1, Medium: 2, High: 3 };
        setRiskLevel(riskMap[opt.risk]);
        if (simulatorRef.current) {
            simulatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        runSimulation();
    }, [runSimulation]);

    if (!isPremiumUser) {
        return (
            <PageLayout title="Investments">
                <div className="p-4 lg:p-6">
                    <UpgradeBanner />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Investments">
            <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold font-serif">Asset Growth Simulator</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-bg-secondary rounded-lg p-1">
                            <button onClick={() => window.location.hash = '#/goals'} className="px-3 py-1.5 rounded-md font-semibold text-text-secondary hover:text-text-primary">Goals</button>
                            <button className="px-3 py-1.5 rounded-md font-semibold bg-bg-primary shadow text-text-primary">Invest</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" ref={simulatorRef}>
                    <Card className="lg:col-span-1 !p-6">
                        <h2 className="text-xl font-bold font-serif mb-4 flex items-center gap-2 text-text-primary"><SparklesIcon className="h-6 w-6 text-brand-primary"/>Simulator Settings</h2>
                        {selectedOption && (
                            <div className="mb-3 text-xs text-text-secondary">
                                Simulating: <span className="font-semibold text-text-primary">{selectedOption.name} ({selectedOption.ticker})</span> — {selectedOption.sector}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="font-medium text-sm text-text-secondary flex items-center gap-2 mb-1"><BanknotesIcon className="h-4 w-4 text-brand-primary"/>Initial Investment ({user.currency})</label>
                                <input type="number" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} className="w-full text-lg"/>
                            </div>
                            <div>
                                 <label className="font-medium text-sm text-text-secondary flex items-center gap-2 mb-1"><CalendarDaysIcon className="h-4 w-4 text-brand-primary"/>Duration (Years)</label>
                                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full text-lg"/>
                            </div>
                            <div>
                                <label className="font-medium text-sm text-text-secondary flex items-center gap-2 mb-1"><ArrowTrendingUpIcon className="h-4 w-4 text-brand-primary"/>Risk Level: <span className="font-bold text-brand-primary">{riskLabels[riskLevel-1]}</span></label>
                                <input type="range" min="1" max="3" value={riskLevel} onChange={e => setRiskLevel(parseInt(e.target.value))} className="risk-slider mt-3"/>
                            </div>
                            <VentyButton onClick={runSimulation} disabled={isSimulating} className="!w-full" label={isSimulating ? 'Calculating...' : 'Run Simulation'}/>
                        </div>
                    </Card>

                    <Card className="lg:col-span-2 !p-6">
                        <h3 className="font-bold mb-4 text-text-primary text-lg">Projected Growth</h3>
                        <div className="w-full h-[320px] md:h-[420px]" style={{ minHeight: 320 }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={320} minWidth={0}>
                                <AreaChart data={simulationData || []} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)"/>
                                    <XAxis dataKey="year" stroke="var(--text-secondary)"/>
                                    <YAxis stroke="var(--text-secondary)" tickFormatter={v => formatCurrency(v)}/>
                                    <RechartsTooltip content={<CustomTooltip formatCurrency={formatCurrency} />}/>
                                    <Area type="monotone" dataKey="worstCase" name="Worst Case" fill={currentColors.worst} fillOpacity={0.1} stroke={currentColors.worst} strokeWidth={2} />
                                    <Area type="monotone" dataKey="bestCase" name="Best Case" fill={currentColors.best} fillOpacity={0.1} stroke={currentColors.best} strokeWidth={2} />
                                    <Area type="monotone" dataKey="averageCase" name="Expected" fill={currentColors.avg} fillOpacity={0.2} stroke={currentColors.avg} strokeWidth={3}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {summary && simulationData && (
                            <div className="mt-4 bg-bg-tertiary/50 rounded-lg p-4 border border-border-primary">
                                <p className="text-sm text-text-secondary">
                                    Based on a {riskLabels[riskLevel-1]} risk profile over {duration} years, your investment of {formatCurrency(Number(initialAmount))} could reach approximately {formatCurrency(summary.projectedValue)}.
                                    Worst case around {formatCurrency(simulationData[simulationData.length-1].worstCase)}, best case up to {formatCurrency(simulationData[simulationData.length-1].bestCase)}.
                                    Average monthly growth is {summary.monthlyGrowth.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 })}.
                                    Estimated profit over {duration} years: {formatCurrency(summary.interestEarned)}.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 !p-6">
                        <h3 className="font-bold mb-4 text-text-primary text-lg">Simulation Results</h3>
                        {summary ? (
                            <div className="space-y-5">
                                <div><p className="text-text-secondary text-sm">Total Projected Value</p><p className="text-2xl md:text-3xl font-bold text-text-primary">{formatCurrency(summary.projectedValue)}</p></div>
                                <div><p className="text-text-secondary text-sm">Interest Earned</p><p className="text-xl md:text-2xl font-bold text-feedback-success">{formatCurrency(summary.interestEarned)}</p></div>
                                <div><p className="text-text-secondary text-sm">Avg. Monthly Growth</p><p className="text-xl md:text-2xl font-bold text-text-primary">{summary.monthlyGrowth.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 })}</p></div>
                            </div>
                        ) : (
                            <p className="text-text-secondary">Adjust settings and run the simulation.</p>
                        )}
                        <VentyButton onClick={() => showToast('Goal saved!')} variant="secondary" className="w-full mt-6 !text-sm flex items-center justify-center gap-2"><CheckIcon className="h-4 w-4"/>Save Result as a Goal</VentyButton>
                    </Card>

                    <Card className="lg:col-span-2 !p-6">
                        <h2 className="text-xl md:text-2xl font-bold font-serif mb-4 text-text-primary">Investment Opportunities</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="relative md:col-span-2">
                                 <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary"/>
                                 <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or ticker..." className="w-full pl-12"/>
                            </div>
                            <div className="flex bg-bg-tertiary rounded-lg p-1 border border-border-primary gap-1">
                                {(['All', 'Low', 'Medium', 'High'] as const).map(risk => (
                                    <button key={risk} onClick={() => setRiskFilter(risk)} className={`flex-1 px-3 py-1.5 rounded-md font-semibold transition-colors text-sm ${riskFilter === risk ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>{risk}</button>
                                ))}
                            </div>
                        </div>
                        <div className="max-h-[460px] overflow-y-auto pr-2 -mr-2">
                            {filteredOptions.length > 0 ? filteredOptions.map(option => (
                                <InvestmentRow key={option.id} option={option} formatCurrency={formatCurrency} onSimulate={handleSimulateOption} />
                            )) : <p className="text-center text-text-secondary py-8">No investments match your criteria.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
};

export default InvestmentScreen;
