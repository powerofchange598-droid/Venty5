
import React, { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    HomeIcon, 
    BuildingStorefrontIcon,
    ChatBubbleLeftRightIcon,
    ChartPieIcon,
    ChartBarIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { User } from '../types';
import { mockInboxMessages } from '../data/mockData';

interface BottomNavProps {
    user: User;
}

interface NavItem {
    path: string;
    icon: React.ElementType;
    label: string;
}

const BottomNav: React.FC<BottomNavProps> = memo(({ user }) => {
    const location = useLocation();

    const navItems: NavItem[] = [
        { path: '/dashboard', icon: HomeIcon, label: 'Home' },
        { path: '/budget', icon: ChartPieIcon, label: 'Budget' },
        { path: '/financial-snapshot', icon: ChartBarIcon, label: 'Snapshot' },
        { path: '/goals', icon: SparklesIcon, label: 'Goals' },
        { path: '/market', icon: BuildingStorefrontIcon, label: 'Store' },
        { path: '/messages', icon: ChatBubbleLeftRightIcon, label: 'Messages' },
    ];

    const unreadCount = mockInboxMessages.filter(m => !m.isRead).length;
    
    return (
        <nav className="lg:hidden bg-bg-secondary border-t border-border-primary pb-[env(safe-area-inset-bottom)] fixed bottom-0 left-0 right-0 z-50">
            <ul className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <li key={item.path} className="flex-1">
                            <NavLink
                                to={item.path}
                                className={`flex flex-col items-center gap-1 p-2 w-full min-w-[64px] transition-colors rounded-lg ${isActive ? 'text-brand-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                            >
                                <div className="relative">
                                    <item.icon className="h-6 w-6" />
                                    {item.path === '/messages' && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-2 block h-4 w-4 rounded-full bg-feedback-error text-white text-[10px] flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                            </NavLink>
                        </li>
                    )
                })}
            </ul>
        </nav>
    );
});

export default BottomNav;
