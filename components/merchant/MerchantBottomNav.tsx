import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, CubeIcon, ShoppingBagIcon, ChatBubbleLeftRightIcon, EllipsisVerticalIcon, PaintBrushIcon, MegaphoneIcon, Cog6ToothIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { User } from '../../types';

interface MerchantBottomNavProps {
    user: User;
}

const MerchantBottomNav: React.FC<MerchantBottomNavProps> = ({ user }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);
    const unreadCount = 0;

    const primaryNavItems = [
        { path: '/merchant/dashboard', icon: ChartBarIcon, label: t('nav.merchant.dashboard') },
        { path: '/merchant/products', icon: CubeIcon, label: t('nav.merchant.products') },
        { path: '/merchant/orders', icon: ShoppingBagIcon, label: t('nav.merchant.orders') },
        { path: '/messages', icon: ChatBubbleLeftRightIcon, label: t('nav.messages'), badge: unreadCount },
    ];

    const morePaths = ['/settings', '/marketing', '/merchant/store-setup'];

    const isActiveMore = location.pathname === '/more' || morePaths.some(p => location.pathname.startsWith(p));
    return (
        <>
            <nav className="lg:hidden bg-bg-secondary border-t border-border-primary pb-[env(safe-area-inset-bottom)] fixed bottom-0 left-0 right-0 z-50">
                <ul className="flex justify-around items-center h-16 px-2">
                    {primaryNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path} className="flex-1">
                                <NavLink
                                    to={item.path}
                                    className={`flex flex-col items-center gap-1 p-2 w-full min-w-[64px] transition-colors rounded-lg ${isActive ? 'text-brand-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                                >
                                    <div className="relative h-11 w-11 flex items-center justify-center rounded-lg">
                                        <item.icon className="h-6 w-6" />
                                        {item.badge && item.badge > 0 && (
                                            <span className="absolute -top-1 -right-2 block h-4 w-4 rounded-full bg-feedback-error text-white text-[10px] flex items-center justify-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                    <li className="flex-1">
                        <button
                            onClick={() => setMoreOpen(true)}
                            className={`flex flex-col items-center gap-1 p-2 w-full min-w-[64px] transition-colors rounded-lg ${isActiveMore ? 'text-brand-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                            aria-haspopup="dialog"
                            aria-expanded={moreOpen}
                        >
                            <div className="relative h-11 w-11 flex items-center justify-center rounded-lg">
                                <EllipsisVerticalIcon className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-medium leading-none">More</span>
                        </button>
                    </li>
                </ul>
            </nav>
            {moreOpen && (
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
                    <div className="absolute left-0 right-0 bottom-0 bg-bg-secondary rounded-t-2xl border-t border-border-primary p-3">
                        <div className="space-y-2">
                            <NavLink to="/merchant/store-setup" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <PaintBrushIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Store Customizer</span>
                            </NavLink>
                            <NavLink to="/marketing" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <MegaphoneIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Ads / Promotions</span>
                            </NavLink>
                            <NavLink to="/merchant/analytics" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <ChartBarIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Analytics</span>
                            </NavLink>
                            <NavLink to="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <Cog6ToothIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Settings</span>
                            </NavLink>
                            <NavLink to="/dashboard" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <ArrowsRightLeftIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Switch to User Mode</span>
                            </NavLink>
                            <NavLink to="/logout" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <EllipsisVerticalIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Logout</span>
                            </NavLink>
                        </div>
                        <div className="h-2" />
                    </div>
                </div>
            )}
        </>
    );
};

export default MerchantBottomNav;
