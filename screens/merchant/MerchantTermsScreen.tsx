import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { User } from '../../types';

const MerchantTermsScreen: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        try { localStorage.setItem(`merchantTermsAccepted_${user.id}`, 'true'); } catch {}
        navigate('/merchant/dashboard', { replace: true });
    };

    return (
        <div className="flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl !rounded-2xl !bg-bg-secondary">
                <div className="mb-4 text-center">
                    <h1 className="text-2xl font-bold text-text-primary">{t('merchantOnboarding.title')}</h1>
                    <p className="text-text-secondary">{t('merchantOnboarding.subtitle')}</p>
                </div>
                <Card className="!p-4 !bg-bg-primary">
                    <div className="flex items-start space-x-2">
                        <input
                            type="checkbox"
                            id="merchant-terms-check"
                            checked={accepted}
                            onChange={() => setAccepted(v => !v)}
                            className="mt-1"
                        />
                        <label
                            htmlFor="merchant-terms-check"
                            className="text-sm text-text-body"
                            dangerouslySetInnerHTML={{ __html: t('merchantOnboarding.terms') }}
                        ></label>
                    </div>
                </Card>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleAccept}
                        disabled={!accepted}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${accepted ? 'bg-brand-primary text-white' : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'}`}
                    >
                        {t('buttons.continue')}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default MerchantTermsScreen;
