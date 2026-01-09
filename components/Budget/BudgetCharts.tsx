
import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import Card from '../Card';
import { useTheme } from '../../hooks/useTheme';
import { useLocalization } from '../../hooks/useLocalization';

// Updated colors to match Royal Blue (light), Gold (dark), Red (dark)
const getThemeColors = (theme: 'light' | 'dark-gold' | 'dark-red') => {
    if (theme === 'dark-gold') {
        return {
            primary: '#D6AF63',
            secondary: '#B68C43',
            accent: '#FFE066',
            background: '#262626',
            white: '#FFFFFF',
            text: '#E5E7EB',
            success: '#22C55E',
            warning: '#F59E0B',
        };
    }
    if (theme === 'dark-red') {
        return {
            primary: '#E53935',
            secondary: '#C62828',
            accent: '#FFCDD2',
            background: '#1F1F23',
            white: '#FFFFFF',
            text: '#F8FAFC',
            success: '#22C55E',
            warning: '#F59E0B',
        };
    }
    return {
        primary: '#4169E1',
        secondary: '#3B82F6',
        accent: '#93C5FD',
        background: '#EFF6FF',
        white: '#FFFFFF',
        text: '#1E293B',
        success: '#22C55E',
        warning: '#F59E0B',
    };
};

const ChartWrapper: React.FC<{ title: string; children: React.ReactNode; centerLabel?: string }> = ({ title, children, centerLabel }) => (
    <Card className="flex flex-col h-full !p-6 bg-bg-secondary min-h-[280px]">
        <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-6 text-center">{title}</h3>
        <div className="flex-grow relative w-full h-[200px]">
            {children}
            {centerLabel && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-text-primary">{centerLabel}</span>
                </div>
            )}
        </div>
    </Card>
);

export const LeftToSpendChart: React.FC<{ left: number; spent: number; currency: string }> = ({ left, spent, currency }) => {
    const { theme } = useTheme();
    const { formatNumberEn } = useLocalization();
    const COLORS = useMemo(() => getThemeColors(theme), [theme]);
    const data = [
        { name: 'Remaining', value: Math.max(0, left), color: COLORS.primary },
        { name: 'Spent', value: spent, color: 'var(--bg-tertiary)' }, 
    ];

    return (
        <ChartWrapper title="AMOUNT LEFT TO SPEND" centerLabel={`${currency}${formatNumberEn(left)}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        formatter={(value: number) => formatNumberEn(value)}
                    />
                </PieChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export const CashFlowChart: React.FC<{ income: number; out: number }> = ({ income, out }) => {
    const { theme } = useTheme();
    const { formatNumberEn } = useLocalization();
    const COLORS = useMemo(() => getThemeColors(theme), [theme]);
    const data = [
        { name: 'Income', value: income },
        { name: 'Out', value: out },
    ];

    return (
        <ChartWrapper title="CASH FLOW SUMMARY">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={50} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        formatter={(value: number) => formatNumberEn(value)}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        <Cell fill={COLORS.secondary} />
                        <Cell fill={COLORS.primary} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export const AllocationChart: React.FC<{ bills: number; expenses: number; savings: number; debt: number }> = ({ bills, expenses, savings, debt }) => {
    const { theme } = useTheme();
    const { formatNumberEn } = useLocalization();
    const COLORS = useMemo(() => getThemeColors(theme), [theme]);
    const data = [
        { name: 'Bills', value: bills, color: COLORS.primary },
        { name: 'Expenses', value: expenses, color: COLORS.secondary },
        { name: 'Savings', value: savings, color: COLORS.accent },
        { name: 'Debt', value: debt, color: 'var(--text-tertiary)' },
    ].filter(d => d.value > 0);

    return (
        <ChartWrapper title="ALLOCATION SUMMARY">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                         formatter={(value: number) => formatNumberEn(value)}
                    />
                </PieChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};
