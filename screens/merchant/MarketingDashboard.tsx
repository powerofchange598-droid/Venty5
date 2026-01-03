
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AdType, MerchantAd, Product, AdSubscription, AdPlanId } from '../../types';
import Card from '../../components/Card';
import VentyButton from '../../components/VentyButton';
import MerchantPageLayout from '../../components/merchant/MerchantPageLayout';
import { useLocalization } from '../../hooks/useLocalization';
import {
    PlusIcon, XMarkIcon, EyeIcon, PhotoIcon, CubeIcon, VideoCameraIcon,
    BuildingStorefrontIcon, CalendarDaysIcon, CheckCircleIcon,
    CurrencyDollarIcon, AdjustmentsHorizontalIcon, InformationCircleIcon, ArrowPathIcon
} from '@heroicons/react/24/solid';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';


// --- TYPES & CONSTANTS ---
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

const adTypes: AdTypeInfo[] = [
    { id: 'product', title: 'Promoted Product', icon: CubeIcon, enabledFor: ['basic', 'pro', 'premium'] },
    { id: 'banner', title: 'Banner Ad', icon: PhotoIcon, enabledFor: ['pro', 'premium'] },
    { id: 'carousel', title: 'Carousel Ad', icon: RectangleStackIcon, enabledFor: ['pro', 'premium'] },
    { id: 'video', title: 'Video Ad', icon: VideoCameraIcon, enabledFor: ['premium'] },
    { id: 'store_feature', title: 'Featured Store', icon: BuildingStorefrontIcon, enabledFor: ['premium'] },
];

const analyticsData: AnalyticsData[] = [
    { name: 'Day 1', impressions: 4000, clicks: 240 }, { name: 'Day 2', impressions: 3000, clicks: 139 },
    { name: 'Day 3', impressions: 2000, clicks: 980 }, { name: 'Day 4', impressions: 2780, clicks: 390 },
    { name: 'Day 5', impressions: 1890, clicks: 480 }, { name: 'Day 6', impressions: 2390, clicks: 380 },
    { name: 'Day 7', impressions: 3490, clicks: 430 },
];

// --- VIDEO GENERATOR REMOVED ---


// --- MAIN SCREEN ---
interface MarketingDashboardProps {
    user: User;
    ads: MerchantAd[];
    onCreateAd: (ad: MerchantAd) => void;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ user, ads, onCreateAd }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    const subscription = user.merchantProfile?.subscription;

    const merchantAds = useMemo(() => ads.filter(ad => ad.merchantId === user.merchantProfile?.slug || ad.merchantId === user.id), [ads, user]);

    useEffect(() => {
        if (location.state?.fromPayment && subscription) {
            setShowConfirmation(true);
            navigate(location.pathname, { replace: true, state: {} }); // Clear state after showing
        }
    }, [location.state, subscription, navigate]);

    const handleSubscribe = useCallback((pkg: AdPackage) => {
        const now = new Date();
        const endDate = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
        
        const adSubscriptionDetails: AdSubscription = {
            planId: pkg.id,
            name: pkg.name,
            price: pkg.price,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            autoRenews: true,
        };
        
        navigate('/payment', { state: { 
            for: 'ad_subscription', 
            amount: pkg.price, 
            description: `Venty Ad Subscription: ${pkg.name}`,
            planDetails: adSubscriptionDetails 
        }});
    }, [navigate]);

    if (!subscription) {
        return (
            <MerchantPageLayout title="Marketing">
                 <div className="py-6"><AdPackagesSection onSubscribe={handleSubscribe} /></div>
            </MerchantPageLayout>
        );
    }

    return (
        <MerchantPageLayout title="Marketing Center">
            {showConfirmation && <ConfirmationModal subscription={subscription} onClose={() => setShowConfirmation(false)} />}
            
            <div className="py-6 space-y-6">
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
const packages: AdPackage[] = [
    { id: 'basic', name: 'Basic Plan', price: 10, durationDays: 30 },
    { id: 'pro', name: 'Pro Plan', price: 25, durationDays: 30 },
    { id: 'premium', name: 'Premium Plan', price: 50, durationDays: 30 },
];

const AdPackagesSection: React.FC<{ onSubscribe: (pkg: AdPackage) => void }> = ({ onSubscribe }) => {
    const { formatCurrency } = useLocalization();

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-text-primary">Unlock Your Marketing Potential</h2>
            <p className="text-text-secondary text-center mb-8 max-w-2xl mx-auto">Choose a plan to start creating campaigns, boosting your visibility, and driving more sales to your store.</p>
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
            >
                {packages.map(pkg => (
                    <motion.div key={pkg.id} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                        <div className="ad-package-card flex flex-col text-center p-8 h-full">
                            <h3 className="text-2xl font-bold font-serif">{pkg.name}</h3>
                            <p className="text-4xl font-bold my-4 text-brand-primary">{formatCurrency(pkg.price)}<span className="text-base font-normal text-text-secondary"> / month</span></p>
                            <ul className="text-left space-y-2 text-sm text-text-secondary flex-grow mb-8">
                                <li className="flex items-center space-x-2"><CheckCircleIcon className="h-5 w-5 text-feedback-success"/><span>Promoted Products</span></li>
                                <li className={`flex items-center space-x-2 ${pkg.id === 'basic' ? 'opacity-50' : ''}`}><CheckCircleIcon className={`h-5 w-5 ${pkg.id === 'basic' ? 'text-text-tertiary' : 'text-feedback-success'}`}/><span>Banner & Carousel Ads</span></li>
                                <li className={`flex items-center space-x-2 ${pkg.id !== 'premium' ? 'opacity-50' : ''}`}><CheckCircleIcon className={`h-5 w-5 ${pkg.id !== 'premium' ? 'text-text-tertiary' : 'text-feedback-success'}`}/><span>Video Ads & Featured Store</span></li>
                            </ul>
                            <VentyButton onClick={() => onSubscribe(pkg)} variant={pkg.id === 'pro' ? 'primary' : 'secondary'} className="w-full mt-auto">Subscribe</VentyButton>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};


const ConfirmationModal: React.FC<{ subscription: AdSubscription; onClose: () => void }> = ({ subscription, onClose }) => (
    <AnimatePresence>
        <motion.div className="fixed inset-0 bg-bg-primary/50 backdrop-blur-sm flex justify-center items-center p-4 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-bg-secondary rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
                <CheckCircleIcon className="h-16 text-feedback-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-serif">Subscription Active!</h2>
                <p className="text-text-secondary mt-2">Your {subscription.name} is now active.</p>
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
                <p className="text-text-secondary text-sm">Your active plan: <span className="font-bold text-brand-primary">{subscription.name}</span></p>
            </div>
            <VentyButton onClick={onCreateClick} className="!w-auto !py-2 !px-3 !text-sm flex items-center space-x-1">
                <PlusIcon className="h-5 w-5" /><span>Create New Ad</span>
            </VentyButton>
        </div>
        {ads.length === 0 ? (
            <p className="text-text-secondary text-center py-8">You have no active ad campaigns.</p>
        ) : (
            <div className="space-y-3">
                {ads.map(ad => {
                    const title = ad.content.caption || ad.adType.replace('_', ' ');
                    const image = ad.content.imageUrl || '';
                    return <Card key={ad.id} className="!p-3 flex items-center space-x-3 bg-bg-primary"><div className="w-16 h-16 bg-bg-tertiary rounded-lg flex-shrink-0"><img src={image} alt={title} loading="lazy" className="w-full h-full object-cover rounded-lg"/></div><div className="flex-grow"><p className="font-bold">{title}</p><p className="text-sm capitalize text-text-secondary">{ad.adType.replace('_', ' ')}</p></div><div className="text-right"><p className="font-semibold text-feedback-success">Impressions: {ad.impressions.toLocaleString()}</p><p className="text-sm">Clicks: {ad.clicks.toLocaleString()}</p></div></Card>;
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
             {/* Robust chart container for analytics */}
             <div className="w-full h-[300px] md:h-[400px]" style={{ minHeight: 288 }}>
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                    <LineChart data={analyticsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', borderRadius: '0.75rem' }} />
                        <Legend />
                        <Line type="monotone" dataKey="impressions" name="Impressions" stroke="var(--brand-primary)" strokeWidth={2} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="clicks" name="Clicks" stroke="var(--feedback-success)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
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
            id: `ad_${Date.now()}`, merchantId: user.merchantProfile?.slug || user.id, adType: selectedType.id,
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
        <motion.div className="fixed inset-0 bg-bg-primary/50 backdrop-blur-sm flex justify-center items-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-bg-secondary rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-primary"><h2 className="text-xl font-bold font-serif">Create New Ad Campaign (Step {step}/2)</h2><button onClick={onClose}><XMarkIcon className="h-6 w-6"/></button></div>
                
                <div className="p-6 overflow-y-auto">
                    {step === 1 ? (
                        <ChooseTypeStep availableTypes={availableAdTypes} selectedType={selectedType} onSelect={setSelectedType} onNext={handleNext} />
                    ) : (
                        <ConfigureAdStep type={selectedType!} content={content} setContent={setContent} budget={budget} setBudget={setBudget} duration={duration} setDuration={setDuration} user={user} />
                    )}
                </div>

                {step === 2 && (
                    <div className="p-4 border-t border-border-primary mt-auto flex justify-between">
                        <VentyButton onClick={() => setStep(1)} variant="secondary" label="Back"></VentyButton>
                        <VentyButton onClick={handleLaunch} variant="primary" label="Activate Campaign"></VentyButton>
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
                    <button key={type.id} disabled={!isEnabled} onClick={() => onSelect(type)} className={`relative p-4 rounded-xl border-2 text-center transition-all ${selectedType?.id === type.id ? 'border-brand-primary bg-brand-primary/10' : 'bg-bg-primary'} ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border-primary'}`}>
                        <type.icon className={`h-8 w-8 mx-auto ${selectedType?.id === type.id ? 'text-brand-primary' : 'text-text-secondary'}`} />
                        <p className="font-semibold mt-2">{type.title}</p>
                        {!isEnabled && <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">PRO</div>}
                    </button>
                );
            })}
        </div>
        <VentyButton onClick={onNext} disabled={!selectedType} label="Continue"></VentyButton>
    </div>
);

const AdPreview: React.FC<{ type: AdTypeInfo; content: Partial<MerchantAd['content']>; user: User }> = ({ type, content, user }) => {
    const title = content.caption || type.title;
    const image = content.imageUrl || content.videoUrl || 'https://via.placeholder.com/150';

    return (
        <div className="bg-bg-primary p-4 rounded-xl border border-border-primary shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                     {user.merchantProfile?.logoUrl ? <img src={user.merchantProfile.logoUrl} className="w-full h-full object-cover"/> : <BuildingStorefrontIcon className="p-1 text-gray-500"/>}
                </div>
                <div>
                    <p className="font-bold text-sm">{user.merchantProfile?.storeName || user.name}</p>
                    <p className="text-xs text-text-secondary">Sponsored</p>
                </div>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                {type.id === 'video' ? (
                     <VideoCameraIcon className="h-12 w-12 text-gray-400"/>
                ) : (
                     <img src={image} className="w-full h-full object-cover" alt="Ad Preview"/>
                )}
            </div>
            <div className="p-1">
                 <p className="font-medium">{title}</p>
                 <button className="w-full mt-2 py-1.5 bg-brand-primary text-white text-sm font-bold rounded-lg">Shop Now</button>
            </div>
        </div>
    );
};

const ConfigureAdStep: React.FC<{ type: AdTypeInfo; content: Partial<MerchantAd['content']>; setContent: (c: Partial<MerchantAd['content']>) => void; budget: number; setBudget: (b: number) => void; duration: number; setDuration: (d: number) => void; user: User; }> = ({ type, content, setContent, budget, setBudget, duration, setDuration, user }) => {
    const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
    useEffect(() => {
        const slug = user.merchantProfile?.slug;
        if (!slug) {
            setMerchantProducts([]);
            return;
        }
        let cancelled = false;
        (async () => {
            const res = await api.listMerchantProducts(slug);
            const items = (res.ok && res.data && Array.isArray(res.data.items)) ? res.data.items : [];
            if (!cancelled) setMerchantProducts(items as Product[]);
        })();
        return () => { cancelled = true; };
    }, [user]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Configure Content</h3>
                    <div className="space-y-4">
                        {type.id === 'product' && (
                             <div>
                                <label className="text-sm font-medium block mb-1">Select Product</label>
                                <select value={content.productId || ''} onChange={e => setContent({ productId: e.target.value })} className="w-full rounded-xl border-border-primary bg-bg-primary px-4 py-2"><option value="" disabled>Choose a product...</option>{merchantProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
                             </div>
                        )}
                        {(type.id === 'banner' || type.id === 'video') && (
                             <div>
                                <label className="text-sm font-medium block mb-1">Media URL</label>
                                <input type="text" value={content.imageUrl || content.videoUrl || ''} onChange={e => setContent({ ...content, [type.id === 'video' ? 'videoUrl' : 'imageUrl']: e.target.value })} placeholder="https://..." className="w-full rounded-xl border-border-primary bg-bg-primary px-4 py-2" />
                             </div>
                        )}
                        {(type.id === 'banner' || type.id === 'carousel' || type.id === 'video') && (
                             <div>
                                <label className="text-sm font-medium block mb-1">Ad Caption</label>
                                <input type="text" value={content.caption || ''} onChange={e => setContent({ ...content, caption: e.target.value })} placeholder="Write a catchy headline..." className="w-full rounded-xl border-border-primary bg-bg-primary px-4 py-2" />
                             </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2">Budget & Reach</h3>
                    <div className="bg-bg-primary p-4 rounded-xl border border-border-primary space-y-4">
                        <div>
                            <div className="flex justify-between mb-1"><label className="text-sm font-medium">Daily Budget</label><span className="font-bold">${budget}</span></div>
                            <input type="range" min="5" max="500" step="5" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-brand-primary"/>
                        </div>
                        <div>
                             <div className="flex justify-between mb-1"><label className="text-sm font-medium">Duration</label><span className="font-bold">{duration} Days</span></div>
                             <input type="range" min="1" max="30" step="1" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-brand-primary"/>
                        </div>
                        <div className="pt-2 border-t border-border-primary flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Est. Reach</span>
                            <span className="text-xl font-bold text-brand-primary">~{((budget / (duration || 1)) * 1000).toLocaleString()} <span className="text-xs text-text-secondary font-normal">people</span></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:sticky md:top-0">
                <h3 className="font-semibold text-lg mb-2">Preview</h3>
                <AdPreview type={type} content={content} user={user} />
                <p className="text-xs text-text-secondary mt-2 text-center">Preview might slightly differ from actual ad.</p>
            </div>
        </div>
    );
};




export default MarketingDashboard;
