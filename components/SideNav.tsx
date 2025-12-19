
import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, ChartPieIcon, BuildingStorefrontIcon, Cog6ToothIcon, ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, ChartBarIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';
import { User } from '../types';
import VerifiedBadge from './VerifiedBadge';
import PremiumBadge from './PremiumBadge';

interface SideNavProps {
    user: User;
    isPremiumUser: boolean;
}

const SideNav: React.FC<SideNavProps> = memo(({ user, isPremiumUser }) => {
    const navItems = [
        { path: '/dashboard', icon: HomeIcon, label: 'Home' },
        { path: '/financial-snapshot', icon: ChartBarIcon, label: 'Snapshot' },
        { path: '/budget', icon: ChartPieIcon, label: 'Budget' },
        { path: '/goals', icon: SparklesIcon, label: 'Goals' },
        { path: '/market', icon: BuildingStorefrontIcon, label: 'Store' },
    ];
    
    if (user.accountPlan === 'family') {
        navItems.splice(3, 0, { path: '/family', icon: UsersIcon, label: 'Family' });
    }
    
    if (!user.isGuest) {
        navItems.push({ path: '/exchange', icon: ArrowsRightLeftIcon, label: 'Exchange' });
    }
    navItems.push({ path: '/messages', icon: ChatBubbleLeftRightIcon, label: 'Messages' });

    // Removed Settings from main nav; Settings is accessible via profile row only.


    return (
        <aside 
            className="hidden lg:flex flex-col h-screen sticky top-0 bg-bg-secondary border-r border-border-primary"
            style={{ width: '260px' }}
        >
            <div className="p-4 border-b border-border-primary">
                <h1 className="text-2xl font-bold font-serif text-brand-primary">Venty</h1>
                <p className="text-xs text-text-secondary mt-1">Your Financial Compass</p>
            </div>
            <nav className="flex-grow p-4 overflow-y-auto">
                <div className="flex flex-col gap-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 ${isActive ? 'bg-brand-primary/10 text-brand-primary font-semibold' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`
                            }
                        >
                            <item.icon className="h-6 w-6 flex-shrink-0" />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
            <div className="mt-auto p-4 border-t border-border-primary">
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-tertiary transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-lg">
                        {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-secondary">Settings</span>
                            <span className="truncate">{user.name}</span>
                            {user.isVerified && <VerifiedBadge user={user} />}
                        </p>
                        {isPremiumUser && <PremiumBadge />}
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    </div>
                </NavLink>
            </div>
        </aside>
    );
});

export default SideNav;
