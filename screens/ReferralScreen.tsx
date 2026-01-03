
import React, { useState } from 'react';
import { User, Referral } from '../types';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { useLocalization } from '../hooks/useLocalization';
import { ShareIcon, DocumentDuplicateIcon, UserPlusIcon, GiftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { safeFormatDate } from '../utils/dateUtils';

interface ReferralScreenProps {
    user: User;
}

const ReferralScreen: React.FC<ReferralScreenProps> = ({ user }) => {
    const { formatCurrency } = useLocalization();
    const [copied, setCopied] = useState(false);
    
    // Fallback if referral code is missing
    const referralCode = user.referralCode || `VENTY-${user.id.substring(0, 4).toUpperCase()}`;
    const referralLink = `https://venty.app/join/${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on Venty!',
                    text: `Use my code ${referralCode} to sign up and get rewards!`,
                    url: referralLink,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            handleCopy();
            alert('Link copied to clipboard!');
        }
    };

    return (
        <PageLayout title="Referral Program">
            <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
                
                {/* Header Card */}
                <Card className="text-center !p-8 bg-brand-primary/5 border border-brand-primary/20">
                    <GiftIcon className="h-16 w-16 mx-auto text-brand-primary mb-4" />
                    <h2 className="text-2xl font-bold font-serif text-text-primary">Invite Friends, Earn Rewards</h2>
                    <p className="text-text-secondary mt-2">
                        Share your unique code. When your friends sign up and verify their account, you both get <span className="font-bold text-brand-primary">$10</span> credit!
                    </p>
                    
                    <div className="mt-6 bg-bg-primary rounded-xl border-2 border-dashed border-border-primary p-4 flex items-center justify-between">
                        <span className="font-mono text-xl font-bold tracking-wider text-text-primary">{referralCode}</span>
                        <button 
                            onClick={handleCopy} 
                            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-brand-primary"
                            title="Copy Code"
                        >
                            {copied ? <CheckCircleIcon className="h-6 w-6"/> : <DocumentDuplicateIcon className="h-6 w-6"/>}
                        </button>
                    </div>

                    <div className="mt-6">
                        <VentyButton onClick={handleShare} className="w-full flex items-center justify-center gap-2">
                            <ShareIcon className="h-5 w-5" />
                            <span>Share Referral Link</span>
                        </VentyButton>
                    </div>
                </Card>

                {/* Empty State (no real referral data yet) */}
                <Card className="text-center !p-8">
                    <UserPlusIcon className="h-10 w-10 mx-auto text-text-secondary mb-2" />
                    <p className="text-text-secondary">No referrals yet. Start inviting to see your rewards here.</p>
                </Card>

                {/* History List */}
                <div>
                    <h3 className="text-lg font-bold font-serif mb-3 px-1">Referral History</h3>
                    <div className="space-y-3">
                        <p className="text-center text-text-secondary py-8">No referral activity yet.</p>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
};

export default ReferralScreen;
