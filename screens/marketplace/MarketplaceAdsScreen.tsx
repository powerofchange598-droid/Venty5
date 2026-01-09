import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AdType, MerchantAd, Product, AdSubscription, AdPlanId } from '../../types';
import Card from '../../components/Card';
import VentyButton from '../../components/VentyButton';
import MerchantPageLayout from '../../components/merchant/MerchantPageLayout';
import { useLocalization } from '../../hooks/useLocalization';
import {
    PlusIcon, XMarkIcon, EyeIcon, PhotoIcon, CubeIcon, VideoCameraIcon,
    BuildingStorefrontIcon, CalendarDaysIcon, CheckCircleIcon, SparklesIcon,
    CurrencyDollarIcon, AdjustmentsHorizontalIcon, InformationCircleIcon
} from '@heroicons/react/24/solid';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

// --- TYPES ---
interface AdTypeInfo {
    id: AdType;
    title: string;
    icon: React.ElementType;
    enabledFor: AdPlanId[];
}
interface AdPackage {
    id: AdPlanId;
    name: string;
    price: number;
    durationDays: number;
}
interface AnalyticsData {
    name: string;
    impressions: number;
    clicks: number;
}

// --- CONSTANTS ---
const adTypes: AdTypeInfo[] = [
    { id: 'product', title: 'Promoted Product', icon: CubeIcon, enabledFor: ['basic', 'pro', 'premium'] },
    { id: 'banner', title: 'Banner Ad', icon: PhotoIcon, enabledFor: ['pro', 'premium'] },
    { id: 'carousel', title: 'Carousel Ad', icon: RectangleStackIcon, enabledFor: ['pro', 'premium'] },
    { id: 'video', title: 'Video Ad', icon: VideoCameraIcon, enabledFor: ['premium'] },
    { id: 'store_feature', title: 'Featured Store', icon: BuildingStorefrontIcon, enabledFor: ['premium'] },
];

const packages: AdPackage[] = [
    { id: 'basic', name: 'Basic Plan', price: 5, durationDays: 30 },
    { id: 'pro', name: 'Pro Plan', price: 15, durationDays: 30 },
    { id: 'premium', name: 'Premium Plan', price: 25, durationDays: 30 },
];

// No synthetic analytics; charts render only when real time-series data exists

// --- MAIN SCREEN ---
interface MarketplaceAdsScreenProps {
    user: User;
    ads: MerchantAd[];
    onCreateAd: (ad: MerchantAd) => void;
}

const MarketplaceAdsScreen: React.FC<MarketplaceAdsScreenProps> = ({ user, ads, onCreateAd }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    const subscription = user.merchantProfile?.subscription;

    const merchantAds = useMemo(() => ads.filter(ad => ad.merchantId === user.id), [ads, user.id]);

    useEffect(() => {
        if (location.state?.fromPayment && subscription) {
            setShowConfirmation(true);
            navigate(location.pathname, { replace: true, state: {} }); // Clear state after showing
        }
    }, [location.state, subscription, navigate]);

    const handleSubscribe = (pkg: AdPackage) => {
        const now = new Date();
        const endDate = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
        const planDetails: AdSubscription = {
            planId: pkg.id, name: pkg.name, price: pkg.price,
            startDate: now.toISOString(), endDate: endDate.toISOString(), autoRenews: true,
        };
        navigate('/payment', { state: { for: 'ad_subscription', amount: pkg.price, description: `Venty Ad Subscription: ${pkg.name}`, planDetails } });
    };

    if (!subscription) {
        return (
            <MerchantPageLayout title="Marketing">
                 <div className="scroll-area p-4 lg:p-6"><AdPackagesSection onSubscribe={handleSubscribe} /></div>
            </MerchantPageLayout>
        );
    }

    return (
        <MerchantPageLayout title="Marketing Center">
            {showConfirmation && <ConfirmationModal subscription={subscription} onClose={() => setShowConfirmation(false)} />}
            
            <div className="scroll-area p-4 lg:p-6 space-y-6">
                <AdCampaignsSection ads={merchantAds} onCreateClick={() => setIsEditorOpen(true)} subscription={subscription} />
                <AnalyticsDashboard ads={merchantAds} user={user} />
            </div>

            <AnimatePresence>
                {isEditorOpen && (
                    <AdEditorModal
                        user={user}
                        subscription={subscription}
                        onClose={() => setIsEditorOpen(false)}
                        onSubmit={onCreateAd}
                    />
                )}
            </AnimatePresence>
        </MerchantPageLayout>
    );
};

// --- SUBSCRIPTION & CONFIRMATION COMPONENTS ---

const AdPackagesSection: React.FC<{ onSubscribe: (pkg: AdPackage) => void }> = ({ onSubscribe }) => {
    return (
        <Card>
            <h2 className="text-2xl font-bold font-serif text-center mb-2">Unlock Your Marketing Potential</h2>
            <p className="text-ui-secondary text-center mb-6">Choose a plan to start creating campaigns and boosting your sales.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map(pkg => (
                    <Card key={pkg.id} className="!p-6 flex flex-col text-center border-2 border-ui-border hover:border-brand-primary transition-all">
                        <h3 className="text-xl font-bold font-serif">{pkg.name}</h3>
                        <p className="text-4xl font-bold my-4">${pkg.price}<span className="text-base font-normal text-ui-secondary">/mo</span></p>
                        <ul className="text-left space-y-2 text-sm text-ui-secondary flex-grow">
                            <li className="flex items-center space-x-2"><CheckCircleIcon className="h-5 w-5 text-feedback-success"/><span>Promoted Products</span></li>
                            <li className={`flex items-center space-x-2 ${pkg.id === 'basic' ? 'opacity-50' : ''}`}><CheckCircleIcon className={`h-5 w-5 ${pkg.id === 'basic' ? 'text-ui-tertiary' : 'text-feedback-success'}`}/><span>Banner & Carousel Ads</span></li>
                            <li className={`flex items-center space-x-2 ${pkg.id !== 'premium' ? 'opacity-50' : ''}`}><CheckCircleIcon className={`h-5 w-5 ${pkg.id !== 'premium' ? 'text-ui-tertiary' : 'text-feedback-success'}`}/><span>Video Ads & Featured Store</span></li>
                        </ul>
                        <VentyButton onClick={() => onSubscribe(pkg)} className="w-full mt-6" label="Subscribe"></VentyButton>
                    </Card>
                ))}
            </div>
        </Card>
    );
};

const ConfirmationModal: React.FC<{ subscription: AdSubscription; onClose: () => void }> = ({ subscription, onClose }) => (
    <AnimatePresence>
        <motion.div className="fixed inset-0 modal-backdrop backdrop-blur-sm flex justify-center items-center p-4 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-ui-background rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
                <CheckCircleIcon className="h-16 text-feedback-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-serif">Subscription Active!</h2>
                <p className="text-ui-secondary mt-2">Your {subscription.name} is now active.</p>
                <VentyButton onClick={onClose} className="w-full mt-6" label="Start Creating Ads"></VentyButton>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

// --- CAMPAIGNS & ANALYTICS ---

const AdCampaignsSection: React.FC<{ ads: MerchantAd[]; onCreateClick: () => void; subscription: AdSubscription }> = ({ ads, onCreateClick, subscription }) => (
    <Card>
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-xl font-bold font-serif">Ad Campaigns</h2>
                <p className="text-ui-secondary text-sm">Your active plan: <span className="font-bold text-brand-primary">{subscription.name}</span></p>
            </div>
            <VentyButton onClick={onCreateClick} className="!w-auto !py-2 !px-3 !text-sm flex items-center space-x-1 btn-gradient-success">
                <PlusIcon className="h-5 w-5" /><span>Create New Ad</span>
            </VentyButton>
        </div>
        {ads.length === 0 ? (
            <p className="text-ui-secondary text-center py-8">You have no active ad campaigns.</p>
        ) : (
            <div className="space-y-3">
                {ads.map(ad => {
                    const product = null;
                    return <Card key={ad.id} className="!p-3 flex items-center space-x-3 bg-ui-background"><div className="w-16 h-16 bg-ui-border rounded-lg flex-shrink-0"><img src={product?.imageUrl || ad.content.imageUrl || ''} className="w-full h-full object-cover rounded-lg"/></div><div className="flex-grow"><p className="font-bold">{product?.title || ad.content.caption || ad.adType.replace('_', ' ')}</p><p className="text-sm capitalize text-ui-secondary">{ad.adType.replace('_', ' ')}</p></div><div className="text-right"><p className="font-semibold text-feedback-success">Impressions: {ad.impressions.toLocaleString()}</p><p className="text-sm">Clicks: {ad.clicks.toLocaleString()}</p></div></Card>;
                })}
            </div>
        )}
    </Card>
);

const AnalyticsDashboard: React.FC<{ ads: MerchantAd[]; user: User }> = ({ ads, user }) => {
    const { formatCurrency } = useLocalization();
    const { totalImpressions, totalClicks, totalConversions, totalSpend } = useMemo(() => {
        return ads.reduce((acc, ad) => ({
            totalImpressions: acc.totalImpressions + ad.impressions,
            totalClicks: acc.totalClicks + ad.clicks,
            totalConversions: acc.totalConversions + ad.conversions,
            totalSpend: acc.totalSpend + ad.budget,
        }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalSpend: 0 });
    }, [ads]);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    return (
        <Card>
            <h2 className="text-xl font-bold font-serif mb-4">Analytics Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card-gradient-analytics p-4 rounded-xl"><p className="text-sm opacity-80">Impressions</p><p className="text-3xl font-bold">{totalImpressions.toLocaleString()}</p></div>
                <div className="card-gradient-analytics p-4 rounded-xl"><p className="text-sm opacity-80">Clicks</p><p className="text-3xl font-bold">{totalClicks.toLocaleString()}</p></div>
                <div className="card-gradient-analytics p-4 rounded-xl"><p className="text-sm opacity-80">CTR</p><p className="text-3xl font-bold">{ctr.toFixed(2)}%</p></div>
                <div className="card-gradient-analytics p-4 rounded-xl"><p className="text-sm opacity-80">Conversions</p><p className="text-3xl font-bold">{totalConversions}</p></div>
            </div>
            <div className="h-72 flex items-center justify-center">
                {totalImpressions > 0 || totalClicks > 0 ? (
                    <p className="text-ui-secondary">Charts require time-series data. Collect more ad data to enable analytics.</p>
                ) : (
                    <p className="text-ui-secondary">No analytics yet. Launch campaigns to see insights here.</p>
                )}
            </div>
        </Card>
    );
};


// --- AD EDITOR MODAL ---

const AdEditorModal: React.FC<{
    user: User;
    subscription: AdSubscription;
    onClose: () => void;
    onSubmit: (ad: MerchantAd) => void;
}> = ({ user, subscription, onClose, onSubmit }) => {
    const availableAdTypes = useMemo(() => adTypes.filter(type => type.enabledFor.includes(subscription.planId)), [subscription]);
    
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<AdTypeInfo | null>(null);
    const [content, setContent] = useState<Partial<MerchantAd['content']>>({});
    const [budget, setBudget] = useState(50);
    const [duration, setDuration] = useState(7);

    const handleNext = () => setStep(2);
    
    const handleLaunch = () => {
        if (!selectedType) return;
        const newAd: MerchantAd = {
            id: `ad_${Date.now()}`, merchantId: user.id, adType: selectedType.id,
            status: 'active', createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
            content: { link: `/shop/${user.merchantProfile?.slug}`, ...content },
            budget, impressions: 0, clicks: 0, ctr: 0, conversions: 0,
            engagementScore: 0,
            reachEstimate: (budget / (duration || 1)) * 1000,
        };
        // Content validation
        if ((newAd.adType === 'product' && !newAd.content.productId) ||
            ((newAd.adType === 'banner' || newAd.adType === 'video') && !newAd.content.imageUrl && !newAd.content.videoUrl)) {
            alert('Please complete the ad content before launching.');
            return;
        }
        if (JSON.stringify(newAd.content).match(/(\d{7,})|(\S+@\S+\.\S+)|(wa.me|t.me|http)/gi)) {
             alert('Ads cannot contain external links or contact information.');
             return;
        }

        onSubmit(newAd);
        onClose();
    };

    return (
        <motion.div className="fixed inset-0 modal-backdrop backdrop-blur-sm flex justify-center items-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-ui-background rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-ui-border"><h2 className="text-xl font-bold font-serif">Create New Ad Campaign (Step {step}/2)</h2><button onClick={onClose}><XMarkIcon className="h-6 w-6"/></button></div>
                
                <div className="p-6 overflow-y-auto">
                    {step === 1 ? (
                        <ChooseTypeStep availableTypes={availableAdTypes} selectedType={selectedType} onSelect={setSelectedType} onNext={handleNext} />
                    ) : (
                        <ConfigureAdStep type={selectedType!} content={content} setContent={setContent} budget={budget} setBudget={setBudget} duration={duration} setDuration={setDuration} user={user} />
                    )}
                </div>

                {step === 2 && (
                    <div className="p-4 border-t border-ui-border mt-auto flex justify-between">
                        <VentyButton onClick={() => setStep(1)} variant="secondary" label="Back"></VentyButton>
                        <VentyButton onClick={handleLaunch} className="btn-gradient-success" label="Activate Campaign"></VentyButton>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const ChooseTypeStep: React.FC<{ availableTypes: AdTypeInfo[]; selectedType: AdTypeInfo | null; onSelect: (type: AdTypeInfo) => void; onNext: () => void; }> = ({ availableTypes, selectedType, onSelect, onNext }) => (
    <div className="space-y-4">
        <h3 className="font-semibold text-lg">1. Choose your ad type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {adTypes.map(type => {
                const isEnabled = availableTypes.some(t => t.id === type.id);
                return (
                    <button key={type.id} disabled={!isEnabled} onClick={() => onSelect(type)} className={`relative p-4 rounded-xl border-2 text-center transition-all ${selectedType?.id === type.id ? 'border-brand-primary bg-brand-primary/10' : 'bg-ui-card'} ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-ui-tertiary'}`}>
                        <type.icon className={`h-8 w-8 mx-auto ${selectedType?.id === type.id ? 'text-brand-primary' : 'text-ui-secondary'}`} />
                        <p className="font-semibold mt-2">{type.title}</p>
                        {!isEnabled && <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-brand-accent text-yellow-900 text-xs font-bold rounded-full">PRO</div>}
                    </button>
                );
            })}
        </div>
        <VentyButton onClick={onNext} disabled={!selectedType} label="Continue"></VentyButton>
    </div>
);

const ConfigureAdStep: React.FC<{ type: AdTypeInfo; content: Partial<MerchantAd['content']>; setContent: (c: Partial<MerchantAd['content']>) => void; budget: number; setBudget: (b: number) => void; duration: number; setDuration: (d: number) => void; user: User; }> = ({ type, content, setContent, budget, setBudget, duration, setDuration, user }) => {
    const merchantProducts = useMemo(() => [], [user.id]);
    
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-lg">2. Configure "{type.title}" Content</h3>
                <div className="mt-2 space-y-3 p-4 bg-ui-card rounded-lg">
                    {type.id === 'product' && <select value={content.productId || ''} onChange={e => setContent({ productId: e.target.value })} className="w-full p-2 bg-ui-background rounded border"><option value="" disabled>Select a product to promote</option>{merchantProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>}
                    {type.id === 'banner' && <input type="text" value={content.imageUrl || ''} onChange={e => setContent({ ...content, imageUrl: e.target.value })} placeholder="Banner image URL (e.g., https://...)" className="w-full p-2 bg-ui-background rounded border" />}
                    {type.id === 'video' && <input type="text" value={content.videoUrl || ''} onChange={e => setContent({ ...content, videoUrl: e.target.value })} placeholder="Video URL (e.g., .mp4)" className="w-full p-2 bg-ui-background rounded border" />}
                    {type.id === 'carousel' && <textarea value={content.carouselImages?.join('\n') || ''} onChange={e => setContent({ ...content, carouselImages: e.target.value.split('\n') })} placeholder="Image URLs (one per line)" rows={3} className="w-full p-2 bg-ui-background rounded border" />}
                    {(type.id === 'banner' || type.id === 'carousel' || type.id === 'video') && <input type="text" value={content.caption || ''} onChange={e => setContent({ ...content, caption: e.target.value })} placeholder="Caption (optional)" className="w-full p-2 bg-ui-background rounded border" />}
                    {(type.id === 'store_feature') && <p className="text-sm text-ui-secondary">Your store will be featured across the app. No extra content needed!</p>}
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-lg">3. Set Budget & Duration</h3>
                <Card className="!p-4 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                        <label className="font-medium text-sm flex items-center space-x-1"><CurrencyDollarIcon className="h-4 w-4"/><span>Budget ($)</span></label>
                        <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full mt-1 p-2 bg-ui-background rounded border"/>
                    </div>
                     <div>
                        <label className="font-medium text-sm flex items-center space-x-1"><CalendarDaysIcon className="h-4 w-4"/><span>Duration (days)</span></label>
                        <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full mt-1 p-2 bg-ui-background rounded border"><option value={1}>1 Day</option><option value={7}>7 Days</option><option value="30">30 Days</option></select>
                    </div>
                    <div className="text-center p-3 bg-ui-background rounded-lg">
                        <p className="text-sm text-ui-secondary">Est. Daily Reach</p>
                        <p className="font-bold text-xl text-brand-primary">~{((budget / (duration || 1)) * 1000).toLocaleString()}</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};


export default MarketplaceAdsScreen;
