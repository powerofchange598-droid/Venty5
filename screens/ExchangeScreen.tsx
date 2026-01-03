

import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { User, ExchangeItem, ExchangeRate } from '../types';
// FIX: Import mockExchangeRates which now exists in mockData, and remove non-existent mockRateTrendData.
import { mockExchangeItems, mockExchangeRates } from '../data/mockData';
import { PlusIcon, ArrowsRightLeftIcon, BanknotesIcon, ChartBarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import PageLayout from '../components/PageLayout';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../hooks/useLocalization';
import HorizontalScroller from '../components/HorizontalScroller';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

type FilterOption = 'all' | 'popular' | 'items' | 'crypto' | 'currencies';

const filters: { id: FilterOption, name: string }[] = [
    { id: 'all', name: 'All' },
    { id: 'popular', name: 'Popular' },
    { id: 'items', name: 'Items' },
    { id: 'crypto', name: 'Crypto' },
    { id: 'currencies', name: 'Currencies' },
];


const ExchangeScreen: React.FC<{ user: User }> = ({ user }) => {
    const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
    const navigate = useNavigate();
    // FIX: Destructure currency from the updated useLocalization hook.
    const { formatCurrency, currency, toEnglishDigits } = useLocalization();

    // State for Converter
    const [amount, setAmount] = useState('1');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState(currency);

    const conversionRate = useMemo(() => {
        const fromRateInUSD = fromCurrency === 'USD' ? 1 : (mockExchangeRates.find(r => r.currency === fromCurrency)?.rate || 0);
        const toRateInUSD = toCurrency === 'USD' ? 1 : (mockExchangeRates.find(r => r.currency === toCurrency)?.rate || 0);
        
        if (fromRateInUSD === 0 || toRateInUSD === 0) return 1;

        // Convert from source currency to USD, then from USD to target currency
        return (1 / fromRateInUSD) * toRateInUSD;
    }, [fromCurrency, toCurrency]);
    
    const convertedAmount = useMemo(() => {
         const numAmount = parseFloat(amount);
         if (isNaN(numAmount)) return '0.00';
         return (numAmount * conversionRate).toFixed(2);
    }, [amount, conversionRate]);

    const localizedExchangeItems = useMemo(() => {
        return mockExchangeItems.filter(p => p.ownerId !== user.id);
    }, [user.id]);
    
    const filteredAndSortedItems = useMemo(() => {
        let items = [...localizedExchangeItems];
        // Filtering
        switch(activeFilter) {
            case 'items': items = items.filter(i => i.type === 'item'); break;
            case 'crypto': items = items.filter(i => i.type === 'crypto'); break;
            case 'currencies': items = items.filter(i => i.type === 'currency'); break;
        }
        // Sorting
        if (activeFilter === 'popular') {
            items.sort((a, b) => b.popularityScore - a.popularityScore);
        } else {
            items.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()); // Newest first
        }
        return items;
    }, [localizedExchangeItems, activeFilter]);
    
    const allCurrencies = useMemo(() => ['USD', ...mockExchangeRates.map(r => r.currency)], []);

    return (
        <PageLayout title="Exchange Market">
            <div className="scroll-area p-4 lg:p-6 space-y-6">
                <Card className="!p-6 card-surface-2">
                    <div className="exchange-container-grid">
                        {/* Column 1: Converter */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold font-serif flex items-center space-x-2"><BanknotesIcon className="h-6 w-6 text-brand-primary icon-glowable"/><span>Quick Converter</span></h2>
                            {/* Converter Form */}
                            <div className="space-y-2">
                                <div>
                                    <label>Amount</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="number" value={amount} onChange={e => setAmount(toEnglishDigits(e.target.value))} className="w-full p-2 bg-bg-secondary rounded-lg border border-border-primary"/>
                                        <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="p-2 bg-bg-secondary rounded-lg border border-border-primary">
                                            {allCurrencies.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-center font-bold text-2xl text-text-secondary">↓</div>
                                <div>
                                    <label>Converted Amount</label>
                                    <div className="flex items-center space-x-2">
                                         <input type="text" value={convertedAmount} readOnly className="w-full p-2 bg-bg-tertiary rounded-lg border border-border-primary cursor-not-allowed"/>
                                         <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="p-2 bg-bg-secondary rounded-lg border border-border-primary">
                                            {allCurrencies.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Rates & Chart */}
                        <div>
                             <h2 className="text-xl font-bold font-serif mb-4 flex items-center space-x-2"><ChartBarIcon className="h-6 w-6 text-brand-primary icon-glowable"/><span>Local Market Rates (vs USD)</span></h2>
                             <div className="space-y-2">
                                {mockExchangeRates.map(rate => (
                                    <div key={rate.currency} className="flex justify-between items-center p-2 rounded-lg bg-bg-secondary">
                                        <span className="font-semibold text-text-primary">{rate.currency}</span>
                                        <div className="flex items-center space-x-1">
                                            <span className="font-mono text-text-primary">{rate.rate.toFixed(2)}</span>
                                            {rate.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 text-green-500"/>}
                                            {rate.trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 text-red-500"/>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold font-serif">Local Listings in {user.countryCode}</h2>
                        <VentyButton onClick={() => navigate('/exchange/post')} className="!w-auto !py-2 !px-3 !text-sm flex items-center space-x-1">
                            <PlusIcon className="h-4 w-4" />
                            <span>Post Item</span>
                        </VentyButton>
                    </div>
                    <HorizontalScroller activeId={`filter-${activeFilter}`}>
                        <div className="flex gap-2 py-1">
                            {filters.map(filter => (
                                <button
                                    id={`filter-${filter.id}`}
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors snap-start ${activeFilter === filter.id ? 'bg-brand-primary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                >
                                    {filter.name}
                                </button>
                            ))}
                        </div>
                    </HorizontalScroller>
                </div>

                {filteredAndSortedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAndSortedItems.map(item => (
                            <Card key={item.id} className="flex flex-col">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-40 rounded-lg object-cover" loading="lazy" />
                                <div className="flex-grow mt-4">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary capitalize">{item.type}</span>
                                    <h3 className="font-bold text-lg mt-1">{item.title}</h3>
                                    <p className="text-sm text-text-secondary">by {item.ownerName}</p>
                                    <p className="text-sm text-text-secondary mt-1">Wants: {item.wantedItems}</p>
                                </div>
                                <div className="flex justify-between items-end mt-4">
                                    <div className="font-bold">{formatCurrency(item.est_value)}</div>
                                    <VentyButton onClick={() => navigate(`/exchange/chat/chat1`)} className="!w-auto !py-2 !px-4 !text-sm flex items-center space-x-1">
                                        <ArrowsRightLeftIcon className="h-5 w-5"/>
                                        <span>Offer</span>
                                    </VentyButton>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-text-secondary">No local exchange items found matching your criteria.</p>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default ExchangeScreen;
