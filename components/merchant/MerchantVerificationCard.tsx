
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import Card from '../Card';
import VentyButton from '../VentyButton';
import PayPalButton from '../PayPalButton';
import { CheckBadgeIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/solid';
import { mockMerchant } from '../../data/mockData';

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = (value / max) * 100;
    return (
        <div className="w-full bg-ui-border rounded-full h-2.5">
            <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

interface MerchantVerificationCardProps {
    user: User;
}

const MerchantVerificationCard: React.FC<MerchantVerificationCardProps> = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const salesCount = useMemo(() => {
        const orders = mockMerchant?.orders || [];
        const soldOrInProgress = orders.filter(o => !['cancelled', 'pending-payment'].includes(o.status)).length;
        return Math.max(0, soldOrInProgress);
    }, []);
    const [selectedGateway, setSelectedGateway] = useState<'card' | 'paypal'>('card');

    const handlePayCard = async () => {
        try {
            const resp = await fetch(`/api/health`);
            const ok = resp.ok;
            if (!ok) {
                alert('Payments are currently disabled.');
                return;
            }
        } catch {
            alert('Payments are currently disabled.');
            return;
        }
        navigate('/payment', { 
            state: { 
                for: 'merchant_verification', 
                amount: 10,
                description: 'Venty Merchant Verification'
            } 
        });
    };

    const handlePayPalSuccess = () => {
        // In a real app, you'd post to backend here. For now, route to payment success flow.
        navigate('/payment', { 
            state: { 
                for: 'merchant_verification', 
                amount: 10,
                description: 'Venty Merchant Verification (PayPal)'
            } 
        });
    };

    return (
        <Card className="bg-brand-primary/5 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-3">
                <CheckBadgeIcon className="h-8 w-8 text-brand-primary" />
                <h2 className="text-xl font-bold font-serif">{t('merchantVerification.getVerified')}</h2>
            </div>
            <p className="text-ui-secondary text-sm mb-4">{t('merchantVerification.badgeCriteria')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Sales Progress */}
                <div className="text-center p-4 rounded-lg bg-ui-card">
                    <p className="font-semibold">{t('merchantVerification.salesProgress', { count: salesCount })}</p>
                    <ProgressBar value={salesCount} max={15} />
                </div>

                {/* Separator */}
                <div className="hidden md:flex items-center justify-center">
                    <div className="w-px h-16 bg-ui-border"></div>
                    <span className="absolute bg-brand-primary/5 px-2 font-bold text-ui-secondary">{t('merchantVerification.or')}</span>
                </div>

                {/* Payment Option */}
                <div className="p-4 rounded-lg bg-ui-card">
                    <h3 className="font-bold text-center">{t('merchantVerification.payForBadge')}</h3>
                    <p className="text-3xl font-bold text-brand-primary text-center my-2">{t('merchantVerification.paymentAmount')}</p>
                    
                    <div className="flex space-x-2 mt-3 p-1 bg-ui-border rounded-lg mb-3">
                        <button onClick={() => setSelectedGateway('card')} className={`w-1/2 py-1.5 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${selectedGateway === 'card' ? 'bg-ui-card text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                            <CreditCardIcon className="h-4 w-4"/> {t('merchantVerification.creditCard')}
                        </button>
                        <button onClick={() => setSelectedGateway('paypal')} className={`w-1/2 py-1.5 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${selectedGateway === 'paypal' ? 'bg-ui-card text-text-primary shadow-sm' : 'text-text-secondary'}`}>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337l.756-4.789h3.292c3.271 0 5.864-1.317 6.643-4.887.278-1.272.179-2.28-.423-3.07-.747-.98-2.126-1.53-4.227-1.53H6.18L4.01 21.337h3.066zM8.867 8.94h3.69c1.78 0 2.76.929 2.49 2.164-.22 1.01-.97 1.63-2.28 1.63H10.15l-.893 5.657H8.36L9.61 9.389a.63.63 0 01-.743-.449z"/></svg>
                            {t('merchantVerification.paypal')}
                        </button>
                    </div>

                    {selectedGateway === 'paypal' ? (
                        <PayPalButton 
                            amount={10} 
                            onSuccess={handlePayPalSuccess} 
                        />
                    ) : (
                        <VentyButton onClick={handlePayCard} className="w-full !py-3 !text-sm">
                            {t('merchantVerification.payNow')}
                        </VentyButton>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default MerchantVerificationCard;
