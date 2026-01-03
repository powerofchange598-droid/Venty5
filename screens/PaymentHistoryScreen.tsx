import React, { useState, useMemo } from 'react';
import { User, PaymentRecord, PaymentStatus } from '../types';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import { useLocalization } from '../hooks/useLocalization';
import { CheckCircleIcon, ClockIcon, XCircleIcon, CreditCardIcon } from '@heroicons/react/24/solid';
import { safeFormatDateTime } from '../utils/dateUtils';

// --- PROPS & INTERFACES ---
interface PaymentHistoryScreenProps {
    user: User;
}

// --- HELPERS ---
const statusInfo: Record<PaymentStatus, { icon: React.ElementType; color: string }> = {
    'Completed': { icon: CheckCircleIcon, color: 'text-feedback-success' },
    'Pending': { icon: ClockIcon, color: 'text-feedback-warning' },
    'Failed': { icon: XCircleIcon, color: 'text-feedback-error' },
};

// --- COMPONENTS ---
const PaymentRecordCard: React.FC<{ record: PaymentRecord; formatCurrency: (val: number) => string }> = ({ record, formatCurrency }) => {
    const StatusIcon = statusInfo[record.status].icon;
    const color = statusInfo[record.status].color;

    return (
        <Card className="!p-3 animate-cinematic-enter">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-base">{record.description}</h3>
                    <p className="text-sm text-text-secondary">{record.type}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(record.amount)}</p>
                    <div className={`flex items-center justify-end space-x-1 text-sm font-semibold ${color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span>{record.status}</span>
                    </div>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-bg-tertiary flex justify-between text-xs text-text-secondary">
                <span>{safeFormatDateTime(record.date)}</span>
                {record.paymentMethod && (
                    <span className="flex items-center space-x-1 font-medium">
                        <CreditCardIcon className="h-4 w-4" />
                        <span>{record.paymentMethod}</span>
                    </span>
                )}
            </div>
        </Card>
    );
};

const FilterControls: React.FC<{
    onStatusChange: (status: PaymentStatus | 'all') => void;
    onDateChange: (range: 'all' | '7d' | '30d') => void;
}> = ({ onStatusChange, onDateChange }) => (
    <Card className="!p-3">
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
                <label className="text-xs font-medium">Status</label>
                <select onChange={e => onStatusChange(e.target.value as any)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border border-bg-tertiary">
                    <option value="all">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="text-xs font-medium">Date Range</label>
                <select onChange={e => onDateChange(e.target.value as any)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border border-bg-tertiary">
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                </select>
            </div>
        </div>
    </Card>
);


// --- MAIN SCREEN ---
const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ user }) => {
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
    const { formatCurrency } = useLocalization();

    const filteredRecords = useMemo(() => {
        const recordsSource: PaymentRecord[] = [];
        let records = [...recordsSource];

        if (statusFilter !== 'all') {
            records = records.filter(r => r.status === statusFilter);
        }

        if (dateFilter !== 'all') {
            const now = Date.now();
            const days = dateFilter === '7d' ? 7 : 30;
            const cutoff = now - days * 24 * 60 * 60 * 1000;
            records = records.filter(r => new Date(r.date).getTime() >= cutoff);
        }

        return records;
    }, [statusFilter, dateFilter]);

    return (
        <PageLayout title="Payment History">
            <div className="p-4 lg:p-5 max-w-3xl mx-auto space-y-4">
                <FilterControls onStatusChange={setStatusFilter} onDateChange={setDateFilter} />
                
                {filteredRecords.length > 0 ? (
                    <div className="space-y-3">
                        {filteredRecords.map(record => (
                            <PaymentRecordCard key={record.id} record={record} formatCurrency={formatCurrency} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <h2 className="text-xl font-bold">No Transactions Found</h2>
                        <p className="text-text-secondary mt-2">Try adjusting your filters.</p>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
};

export default PaymentHistoryScreen;
