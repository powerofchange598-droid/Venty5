import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { User } from '../../types';

interface MerchantLayoutProps {
    user: User;
}

export const MerchantLayout: React.FC<MerchantLayoutProps> = ({ user }) => {
    if (user.accountType === 'merchant' && !user.merchantProfile) {
        return <Navigate to="/merchant/onboard" replace />;
    }
    if (user.accountType === 'merchant') {
        try {
            const accepted = localStorage.getItem(`merchantTermsAccepted_${user.id}`) === 'true';
            if (!accepted) return <Navigate to="/merchant/terms" replace />;
        } catch {
            return <Navigate to="/merchant/terms" replace />;
        }
    }

    return <Outlet />;
};
