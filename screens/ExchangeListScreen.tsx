import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, ExchangeTransaction, ExchangeItem } from '../types';
import { mockExchangeRates, mockExchangeHistory, mockExchangeItems } from '../data/mockData';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { useLocalization } from '../hooks/useLocalization';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon, BanknotesIcon, LightBulbIcon, PlusIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { safeFormatDate } from '../utils/dateUtils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const PortfolioPreviewCard: React.FC<{ user: User }> = ({ user }) => {
    const { currency } = useLocalization();
    const [amount, setAmount] = useState('500');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');

    const ratesMap = useMemo(() => {
        const map = new Map<string, number>();
        map.set('USD', 1);
        mockExchangeRates.forEach(r => map.set(r.currency, r.rate));
        return map;
    }, []);

    const allCurrencies = useMemo(() => ['USD', ...mockExchangeRates.map(r => r.currency)], []);

    const conversionRate = useMemo(() => {
        const fromRate = ratesMap.get(fromCurrency) || 0;
        const toRate = ratesMap.get(toCurrency) || 0;
        if (fromRate === 0) return 0;
        return toRate / fromRate;
    }, [fromCurrency, toCurrency, ratesMap]);

    const convertedAmount = useMemo(() => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return 0;
        return numAmount * conversionRate;
    }, [amount, conversionRate]);

    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <Card className="!p-6">
            <h3 className="text-xl font-bold font-serif mb-4">Portfolio Preview</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">You send</label>
                    <div className="flex items-center space-x-2">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-lg"/>
                        <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="text-lg font-semibold bg-bg-secondary border-none">{allCurrencies.map(c => <option key={c}>{c}</option>)}</select>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <button onClick={handleSwapCurrencies} className="p-2 rounded-full bg-bg-tertiary hover:bg-bg-primary transition-colors"><ArrowsRightLeftIcon className="h-5 w-5"/></button>
                </div>
                <div>
                    <label className="text-sm font-medium">You receive</label>
                    <div className="flex items-center space-x-2">
                         <input type="text" value={convertedAmount.toFixed(2)} readOnly className="w-full text-lg bg-bg-primary cursor-not-allowed"/>
                         <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="text-lg font-semibold bg-bg-secondary border-none">{allCurrencies.map(c => <option key={c}>{c}</option>)}</select>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">1 {fromCurrency} ≈ {conversionRate.toFixed(4)} {toCurrency}</p>
                </div>
                <VentyButton onClick={() => alert('Exchange functionality coming soon.')} className="w-full">Exchange Now</VentyButton>
            </div>
        </Card>
    );
};

const MarketRatesTable: React.FC = () => {
    const ratesData = [
        { from: 'USD', to: 'EUR', rate: 0.92, trend: 'down' as const, change: -0.001 },
        { from: 'USD', to: 'GBP', rate: 0.79, trend: 'up' as const, change: 0.002 },
        { from: 'USD', to: 'EGP', rate: 47.5, trend: 'up' as const, change: 0.1 },
        { from: 'EUR', to: 'GBP', rate: 0.85, trend: 'up' as const, change: 0.003 },
    ];
    return (
         <Card className="!p-6">
            <h3 className="text-xl font-bold font-serif mb-4">Live Exchange Rates</h3>
            <div className="space-y-2">
                {ratesData.map(rate => (
                    <div key={`${rate.from}-${rate.to}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-bg-tertiary transition-colors">
                        <div className="font-semibold text-text-primary">{rate.from} / {rate.to}</div>
                        <div className="text-right">
                            <p className="font-semibold text-text-primary">{rate.rate.toFixed(4)}</p>
                            <div className={`flex items-center justify-end text-xs font-medium ${rate.trend === 'up' ? 'text-feedback-success' : 'text-feedback-error'}`}>
                                {rate.trend === 'up' ? <ArrowTrendingUpIcon className="h-3 w-3 mr-1"/> : <ArrowTrendingDownIcon className="h-3 w-3 mr-1"/>}
                                <span>{rate.change.toFixed(4)} (24h)</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-text-secondary text-center mt-3">Last updated: {new Date().toLocaleTimeString()}</p>
        </Card>
    );
};

const RecentTransactions: React.FC = () => {
    const { formatCurrency } = useLocalization();
    const history = mockExchangeHistory;

    return (
        <Card className="!p-6">
            <h3 className="text-xl font-bold font-serif mb-4">Recent Transactions</h3>
            {history.length === 0 ? (
                <p className="text-text-secondary text-center py-8">Your past exchanges will appear here.</p>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                    {history.map(tx => (
                        <div key={tx.id} className="flex items-center space-x-3 p-2 rounded-lg bg-bg-primary">
                            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0"><BanknotesIcon className="h-5 w-5"/></div>
                            <div className="flex-grow">
                                <p className="font-semibold text-sm">Exchanged {tx.fromCurrency} to {tx.toCurrency}</p>
                                <p className="text-xs text-text-secondary">{safeFormatDate(tx.date)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm">{formatCurrency(tx.toAmount)}</p>
                                <p className="text-xs text-text-secondary">Fee: {formatCurrency(tx.fee)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const SuggestedOpportunities: React.FC = () => {
    return (
        <Card className="!p-6 bg-brand-primary/10 border border-brand-primary/20">
            <h3 className="text-xl font-bold font-serif mb-4 flex items-center gap-2"><LightBulbIcon className="h-6 w-6 text-brand-primary"/>Suggested Exchanges</h3>
            <div className="space-y-2">
                <p>📈 Best rates now:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li><strong>USD → GBP:</strong> Rate is up 0.4% in the last 24h.</li>
                    <li><strong>EUR → GBP:</strong> Favorable trend for conversion.</li>
                </ul>
            </div>
        </Card>
    );
};

const ProductExchangeCard: React.FC<{ item: ExchangeItem; onClick: () => void; }> = ({ item, onClick }) => {
    const { formatCurrency } = useLocalization();
    return (
        <motion.div variants={itemVariants} onClick={onClick}>
            <Card className="group !p-4 flex flex-col h-full cursor-pointer">
                <div className="relative overflow-hidden rounded-lg">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="flex-grow mt-3">
                    <p className="text-xs text-text-secondary">{item.category}</p>
                    <h3 className="font-semibold text-text-primary mt-1 truncate">{item.title}</h3>
                    <p className="text-sm text-text-secondary truncate h-10">{item.description}</p>
                </div>
                <div className="flex justify-between items-center mt-3">
                    <div>
                        <p className="text-xs text-text-secondary">Value</p>
                        <p className="font-bold text-brand-primary">{formatCurrency(item.est_value)}</p>
                    </div>
                    <VentyButton 
                        onClick={(e) => { e.stopPropagation(); onClick(); }} 
                        variant="primary" 
                        className="!w-auto !py-2 !px-4 !text-sm">
                        Exchange
                    </VentyButton>
                </div>
            </Card>
        </motion.div>
    );
};


const ExchangeListScreen: React.FC<{ user: User }> = ({ user }) => {
    const navigate = useNavigate();
    
    return (
        <PageLayout title="Exchange Hub">
            <motion.div 
                className="py-6 space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Currency Exchange Section */}
                <motion.section variants={itemVariants}>
                    <h2 className="text-xl md:text-2xl font-bold font-serif mb-4">Currency Exchange</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PortfolioPreviewCard user={user} />
                        <MarketRatesTable />
                        <RecentTransactions />
                        <SuggestedOpportunities />
                    </div>
                </motion.section>

                {/* Product Exchange Section */}
                <motion.section variants={itemVariants} className="pt-8 border-t border-border-primary">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl md:text-2xl font-bold font-serif">Product Exchange Market</h2>
                        <VentyButton onClick={() => navigate('/exchange/post')} className="!w-auto !py-2 !px-3 !text-sm flex items-center space-x-1">
                            <PlusIcon className="h-4 w-4" />
                            <span>Post Item</span>
                        </VentyButton>
                    </div>

                    {mockExchangeItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mockExchangeItems.map(item => (
                                <ProductExchangeCard key={item.id} item={item} onClick={() => navigate(`/exchange/chat/chat1`)} />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-16">
                            <p className="text-text-secondary">No exchange items found.</p>
                        </Card>
                    )}
                </motion.section>
            </motion.div>
        </PageLayout>
    );
};

export default ExchangeListScreen;
