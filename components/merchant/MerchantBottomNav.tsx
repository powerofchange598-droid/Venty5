import React, { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, CubeIcon, ShoppingBagIcon, ChatBubbleLeftRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { User } from '../../types';
import { mockMerchantInboxMessages } from '../../data/mockData';

interface MerchantBottomNavProps {
    user: User;
}

const MerchantBottomNav: React.FC<MerchantBottomNavProps> = ({ user }) => {
    const { t } = useTranslation();
    const location = useLocation();
    
    const unreadCount = mockMerchantInboxMessages.filter(m => !m.isRead).length;

    const primaryNavItems = [
        { path: '/merchant/dashboard', icon: ChartBarIcon, label: t('nav.merchant.dashboard') },
        { path: '/merchant/products', icon: CubeIcon, label: t('nav.merchant.products') },
        { path: '/merchant/orders', icon: ShoppingBagIcon, label: t('nav.merchant.orders') },
        { path: '/messages', icon: ChatBubbleLeftRightIcon, label: t('nav.messages'), badge: unreadCount },
        { path: '/more', icon: EllipsisHorizontalIcon, label: 'More' },
    ];

    const morePaths = ['/settings', '/marketing', '/merchant/store-setup'];

    const isActiveMore = location.pathname === '/more' || morePaths.some(p => location.pathname.startsWith(p));
    return (
        <nav className="lg:hidden bg-bg-secondary border-t border-border-primary pb-[env(safe-area-inset-bottom)] fixed bottom-0 left-0 right-0 z-50">
            <ul className="flex justify-around items-center h-16 px-2">
                {primaryNavItems.map((item) => {
                    const isActive = item.path === '/more' ? isActiveMore : location.pathname === item.path;
                    return (
                        <li key={item.path} className="flex-1">
                            <NavLink
                                to={item.path}
                                className={`flex flex-col items-center gap-1 p-2 w-full min-w-[64px] transition-colors rounded-lg ${isActive ? 'text-brand-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                            >
                                <div className="relative">
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
            </ul>
        </nav>
    );
};

export default MerchantBottomNav;
