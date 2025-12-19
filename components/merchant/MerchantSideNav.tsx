



import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBarIcon, CubeIcon, ShoppingBagIcon, Cog6ToothIcon, BuildingStorefrontIcon, PaintBrushIcon, ChatBubbleLeftRightIcon, MegaphoneIcon } from '@heroicons/react/24/solid';

const MerchantSideNav: React.FC = memo(() => {
    
    const allNavItems = [
        { path: '/merchant/dashboard', icon: ChartBarIcon, label: 'Dashboard' },
        { path: '/merchant/products', icon: CubeIcon, label: 'Products' },
        { path: '/merchant/orders', icon: ShoppingBagIcon, label: 'Orders' },
        { path: '/messages', icon: ChatBubbleLeftRightIcon, label: 'Messages' },
        { path: '/merchant/store-setup', icon: PaintBrushIcon, label: 'Store setup' },
        { path: '/marketing', icon: MegaphoneIcon, label: 'Marketing' },
        { path: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
    ];
    
    const NavLinkItem: React.FC<{ item: typeof allNavItems[0] }> = ({ item }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center space-x-3 p-2.5 rounded-lg transition-colors duration-150 ${isActive ? 'bg-bg-secondary text-text-primary' : 'hover:bg-bg-tertiary'}`
            }
        >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold text-sm">{item.label}</span>
        </NavLink>
    );

    return (
        <aside 
            className="hidden lg:flex flex-col h-screen sticky top-0"
            style={{ width: '240px' }}
        >
            <div className="p-3 border-b border-border-primary">
                <div className="flex items-center space-x-2">
                    <BuildingStorefrontIcon className="h-7 w-7 text-brand-primary"/>
                    <h1 className="text-2xl logo-text">Venty</h1>
                </div>
                <p className="text-xs text-text-secondary mt-1">Merchant Dashboard</p>
            </div>
            <div className="flex-grow p-3 space-y-1.5 overflow-y-auto">
                {allNavItems.map((item) => <NavLinkItem key={item.path} item={item} />)}
            </div>
        </aside>
    );
});

export default MerchantSideNav;
