import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from '../../types';

interface MerchantLayoutProps {
    user: User;
}

export const MerchantLayout: React.FC<MerchantLayoutProps> = ({ user }) => {
    const location = useLocation();
    // Enforce Merchant Role
    if (user.accountType !== 'merchant') {
        return <Navigate to="/dashboard" replace />;
    }

    const allowWithoutProfile = location.pathname.startsWith('/merchant/store-setup') || location.pathname.startsWith('/merchant/onboard');
    if (user.accountType === 'merchant' && !user.merchantProfile && !allowWithoutProfile) {
        const key = `merchantOnboardingShown_${user.id}`;
        let hasShown = false;
        try { hasShown = localStorage.getItem(key) === 'true'; } catch {}
        if (!hasShown) {
            try { localStorage.setItem(key, 'true'); } catch {}
            return <Navigate to="/merchant/onboard" replace />;
        }
        // Allow navigation without forcing Store Setup repeatedly
        // User can open dashboard or any merchant pages; Store Setup remains accessible from nav.
        return <Outlet />;
    }
    
    try {
        const accepted = localStorage.getItem(`merchantTermsAccepted_${user.id}`) === 'true';
        if (!accepted) return <Navigate to="/merchant/terms" replace />;
    } catch {
        return <Navigate to="/merchant/terms" replace />;
    }

    return <Outlet />;
};
