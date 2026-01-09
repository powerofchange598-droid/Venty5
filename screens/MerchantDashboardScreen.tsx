import React, { useState } from 'react';
import { User } from '../types';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import ShareModal from '../components/ShareModal';
import MerchantPageLayout from '../components/merchant/MerchantPageLayout';
import SmartNudge from '../components/merchant/SmartNudge'; 
import MerchantVerificationCard from '../components/merchant/MerchantVerificationCard'; 
import { CubeIcon, ShoppingBagIcon, BanknotesIcon, UsersIcon, CheckBadgeIcon, ShareIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockMerchant } from '../data/mockData';
import { useLocalization } from '../hooks/useLocalization';

interface MerchantDashboardScreenProps {
    user: User;
}

// Re-purposed StatCard to be used as a KPI inside the main analytics card.
const KPIStatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: 'primary' | 'accent' | 'purple' | 'orange' }> = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        primary: 'bg-brand-primary/10 text-brand-primary',
        accent: 'bg-brand-accent/10 text-brand-accent',
        purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    };
    return (
        <div className="bg-bg-primary/50 dark:bg-bg-secondary/50 p-4 rounded-xl border border-bg-tertiary">
            <div className="flex items-center">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <p className="text-2xl font-bold text-text-primary">{value}</p>
                </div>
            </div>
        </div>
    );
};


const salesData = [
  { name: 'Week 1', revenue: 4000, orders: 24 },
  { name: 'Week 2', revenue: 3000, orders: 13 },
  { name: 'Week 3', revenue: 2000, orders: 48 },
  { name: 'Week 4', revenue: 2780, orders: 39 },
  { name: 'Week 5', revenue: 1890, orders: 48 },
  { name: 'Week 6', revenue: 2390, orders: 38 },
  { name: 'Week 7', revenue: 3490, orders: 43 },
];

const MerchantDashboardScreen: React.FC<MerchantDashboardScreenProps> = ({ user }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    // Fix: The useLocalization hook does not accept arguments.
    const { formatCurrency } = useLocalization();
    const totalRevenue = mockMerchant.orders.filter(o => o.status === 'completed').reduce((sum, order) => sum + order.total, 0);

    const handleExport = () => {
        alert("Exporting your sales and performance report... (Simulation)\nThis would typically download a PDF or CSV file.");
    };

    return (
        <MerchantPageLayout title="Merchant Dashboard">
            {isShareModalOpen && (
                <ShareModal
                    title="Share Your Store"
                    text={`Check out my store on Venty: ${user.merchantProfile?.brandName}`}
                    url={`${window.location.origin}${window.location.pathname}#/shop/${user.merchantProfile?.slug}?source=share&medium=merchant`}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
            <div className="p-4 lg:p-6 space-y-8">
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-wide flex items-center">
                            Welcome, {user.merchantProfile?.brandName || user.name}
                            {user.merchantProfile?.isVerified && <CheckBadgeIcon className="h-7 w-7 text-brand-primary ml-2" />}
                        </h1>
                        <p className="text-lg text-text-secondary">Here's your store's performance summary.</p>
                    </div>
                    <VentyButton onClick={() => setIsShareModalOpen(true)} className="!w-auto mt-2 sm:mt-0 !py-2 !px-4 !text-sm flex items-center space-x-2">
                        <ShareIcon className="h-5 w-5"/>
                        <span>Share Store</span>
                    </VentyButton>
                </header>

                <SmartNudge />

                {/* Main Hero Section: Sales Analytics */}
                <Card className="!p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-serif font-bold">Sales Analytics</h2>
                        <VentyButton onClick={handleExport} variant="secondary" className="!w-auto !py-1 !px-2 !text-xs flex items-center space-x-1">
                            <DocumentArrowDownIcon className="h-4 w-4"/>
                            <span>Export</span>
                        </VentyButton>
                    </div>
                    
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KPIStatCard title="Total Products" value={mockMerchant.products.length.toString()} icon={CubeIcon} color="primary"/>
                        <KPIStatCard title="Total Orders" value={mockMerchant.orders.length.toString()} icon={ShoppingBagIcon} color="accent"/>
                        <KPIStatCard title="Monthly Revenue" value={formatCurrency(totalRevenue)} icon={BanknotesIcon} color="purple"/>
                        <KPIStatCard title="Active Customers" value="67" icon={UsersIcon} color="orange"/>
                    </div>
                    
                    {/* Chart */}
                    <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={salesData}
                              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--bg-tertiary))" />
                              <XAxis dataKey="name" stroke="rgb(var(--text-secondary))" />
                              <YAxis stroke="rgb(var(--text-secondary))" tickFormatter={(value) => formatCurrency(value as number).replace(/(\.00|,00)/, '')} />
                              <Tooltip 
                                 formatter={(value: number, name: string) => name === 'revenue' ? formatCurrency(value) : value} 
                                 contentStyle={{
                                     backgroundColor: 'rgb(var(--bg-secondary))',
                                     borderColor: 'rgb(var(--bg-tertiary))',
                                     borderRadius: '0.75rem'
                                 }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="revenue" stroke="rgb(var(--brand-primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                              <Line type="monotone" dataKey="orders" stroke="rgb(var(--feedback-success))" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                    </div>
                </Card>

                {/* Secondary Section: Suggested Services */}
                <div>
                     <h2 className="text-2xl font-serif font-bold mb-4">Grow Your Business</h2>
                     <div className="space-y-6">
                        {!user.merchantProfile?.isVerified && (
                            <MerchantVerificationCard user={user} />
                        )}
                     </div>
                </div>

            </div>
        </MerchantPageLayout>
    );
};

export default MerchantDashboardScreen;
