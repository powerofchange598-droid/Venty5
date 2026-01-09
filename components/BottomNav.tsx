
import React, { memo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    HomeIcon, 
    ChatBubbleLeftRightIcon,
    ChartPieIcon,
    ChartBarIcon,
    SparklesIcon,
    EllipsisVerticalIcon,
    BuildingStorefrontIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    UserIcon
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

    const [moreOpen, setMoreOpen] = useState(false);
    const navItems: NavItem[] = [
        { path: '/dashboard', icon: HomeIcon, label: 'Home' },
        { path: '/budget', icon: ChartPieIcon, label: 'Budget' },
        { path: '/financial-snapshot', icon: ChartBarIcon, label: 'Snapshot' },
        { path: '/goals', icon: SparklesIcon, label: 'Goals' },
    ];

    const unreadCount = mockInboxMessages.filter(m => !m.isRead).length;
    
    return (
        <>
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
                                    <div className="relative h-11 w-11 flex items-center justify-center rounded-lg">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                                </NavLink>
                            </li>
                        )
                    })}
                    <li className="flex-1">
                        <button
                            onClick={() => setMoreOpen(true)}
                            className="flex flex-col items-center gap-1 p-2 w-full min-w-[64px] transition-colors rounded-lg text-text-secondary hover:bg-bg-tertiary"
                            aria-haspopup="dialog"
                            aria-expanded={moreOpen}
                        >
                            <div className="relative h-11 w-11 flex items-center justify-center rounded-lg">
                                <EllipsisVerticalIcon className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 block h-2 w-2 rounded-full bg-feedback-error"></span>
                                )}
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
                            <NavLink to="/messages" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Messages</span>
                            </NavLink>
                            <NavLink to="/market" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <BuildingStorefrontIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Store</span>
                            </NavLink>
                            <NavLink to="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <Cog6ToothIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Settings</span>
                            </NavLink>
                            <NavLink to="/support" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <QuestionMarkCircleIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Help / Support</span>
                            </NavLink>
                            <NavLink to="/profile" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-tertiary">
                                <UserIcon className="h-5 w-5" />
                                <span className="text-sm font-semibold">Profile</span>
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
});

export default BottomNav;
