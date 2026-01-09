import React, { useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { useLocalization } from '../hooks/useLocalization';
// Using a lightweight sample type for demo items

type InvestmentSample = { id: string; name: string; invested: number; current: number; status: 'active' | 'completed' };
const sample: InvestmentSample[] = [
  { id: 'inv-1', name: 'Index Fund (S&P 500)', invested: 5000, current: 5600, status: 'active' },
  { id: 'inv-2', name: 'Government Bonds', invested: 3000, current: 3100, status: 'active' },
  { id: 'inv-3', name: 'Tech Growth ETF', invested: 2000, current: 2500, status: 'completed' },
];

const InvestmentsScreen: React.FC = () => {
  const { formatCurrency } = useLocalization();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const items = useMemo(() => sample.filter(s => filter === 'all' ? true : s.status === filter), [filter]);

  return (
    <PageLayout title="Investments">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-serif">Asset Growth Simulator</h1>
          <div className="flex items-center gap-2">
            <div className="flex bg-bg-secondary rounded-lg p-1">
              <button onClick={() => { window.location.hash = '#/goals'; }} className="px-3 py-1.5 rounded-md font-semibold text-text-secondary hover:text-text-primary">Goals</button>
              <button className="px-3 py-1.5 rounded-md font-semibold bg-bg-primary shadow text-text-primary">Invest</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(inv => {
            const profit = inv.current - inv.invested;
            const pct = inv.invested > 0 ? ((inv.current / inv.invested) - 1) * 100 : 0;
            return (
              <Card key={inv.id} className="!p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">{inv.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${inv.status === 'active' ? 'bg-feedback-success/15 text-feedback-success' : 'bg-neutral/15 text-text-secondary'}`}>{inv.status}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-text-secondary">Invested</p>
                    <p className="text-text-primary font-medium">{formatCurrency(inv.invested)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Current</p>
                    <p className="text-text-primary font-medium">{formatCurrency(inv.current)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Profit</p>
                    <p className={`font-medium ${profit >= 0 ? 'text-feedback-success' : 'text-feedback-error'}`}>{formatCurrency(profit)} ({pct.toFixed(1)}%)</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <VentyButton variant="outline" onClick={() => {}}>View Details</VentyButton>
                  <VentyButton variant="secondary" onClick={() => {}}>Manage</VentyButton>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default InvestmentsScreen;
