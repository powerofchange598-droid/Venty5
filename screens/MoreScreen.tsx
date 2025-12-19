
import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../types';
import {
    ChartBarIcon,
    SparklesIcon,
    ArrowsRightLeftIcon,
    UsersIcon,
    Cog6ToothIcon,
    MegaphoneIcon,
    PaintBrushIcon,
    ChevronRightIcon,
    BanknotesIcon,
    QuestionMarkCircleIcon,
    UserPlusIcon,
    ShoppingBagIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface MoreScreenProps {
    user: User;
}

interface NavItemProps {
    path?: string;
    onClick?: () => void;
    icon: React.ElementType;
    label: string;
}

const NavItem: React.FC<NavItemProps> = ({ path, onClick, icon: Icon, label }) => {
    const content = (
        <div className="flex items-center justify-between p-3 bg-bg-secondary hover:bg-bg-tertiary transition-colors rounded-lg">
            <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-text-secondary" />
                <span className="font-semibold text-text-primary">{label}</span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-text-tertiary" />
        </div>
    );

    if (path) {
        return <NavLink to={path}>{content}</NavLink>;
    }

    return <button onClick={onClick} className="w-full text-left">{content}</button>;
};

const MoreScreen: React.FC<MoreScreenProps> = ({ user }) => {

    const regularItems: NavItemProps[] = [
        { path: '/goals', icon: SparklesIcon, label: 'Goals' },
        { path: '/payment-methods', icon: BanknotesIcon, label: 'Payment Methods' },
    ];
    
    if (!user.isGuest) {
        regularItems.unshift({ path: '/my-orders', icon: ShoppingBagIcon, label: 'My Orders' });
        regularItems.unshift({ path: '/messages', icon: ChatBubbleLeftRightIcon, label: 'Messages' });
        
        // If family account, Family is on BottomNav, so add Store here.
        // If NOT family account, Store is on BottomNav, so we don't need it here (or maybe we do? No, usually main nav items aren't duplicated).
        if (user.accountPlan === 'family') {
             regularItems.push({ path: '/market', icon: ShoppingBagIcon, label: 'Store' });
        }

        regularItems.push({ path: '/referral', icon: UserPlusIcon, label: 'Refer a Friend' });
    }
    regularItems.push({ path: '/support', icon: QuestionMarkCircleIcon, label: 'Support' });
    regularItems.push({ path: '/settings', icon: Cog6ToothIcon, label: 'Settings' });

    const merchantItems: NavItemProps[] = [
        { path: '/marketing', icon: MegaphoneIcon, label: 'Marketing' },
        { path: '/merchant/store-setup', icon: PaintBrushIcon, label: 'Store Setup' },
        { path: '/payment-methods', icon: BanknotesIcon, label: 'Payment Methods' },
        { path: '/support', icon: QuestionMarkCircleIcon, label: 'Support' },
        { path: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
    ];

    const itemsToShow = user.accountType === 'merchant' ? merchantItems : regularItems;

    return (
        <div className="animate-cinematic-enter h-full flex flex-col">
            <header className="flex items-center justify-between p-3 lg:px-5 sticky top-0 bg-bg-primary/80 backdrop-blur-sm z-10 border-b border-bg-tertiary">
                <div className="w-10"></div>
                <h1 className="text-xl font-serif font-semibold text-center truncate">More</h1>
                <div className="w-10 flex justify-end items-center space-x-2">
                </div>
            </header>
            <div className="flex-grow">
                <div className="p-3 lg:p-5 space-y-2">
                    {itemsToShow.map(({ path, icon, label, onClick }) => (
                        <NavItem key={label} path={path} icon={icon} label={label} onClick={onClick} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MoreScreen;
