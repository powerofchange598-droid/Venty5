import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, MerchantProfile } from '../../types';
import Card from '../../components/Card';
import VentyButton from '../../components/VentyButton';
import { BuildingStorefrontIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import ImageUpload from '../../components/ImageUpload';
import { TOP_100_COUNTRIES } from '../../data/TOP_100_COUNTRIES';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// --- Sub-Components (Extracted and Memoized for performance) ---

const StepIndicator: React.FC<{ steps: string[]; currentStep: number }> = React.memo(({ steps, currentStep: step }) => (
    <div className="flex items-center justify-center space-x-2">
        {steps.map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all ${step === i ? 'w-8 bg-brand-primary' : 'w-2 bg-border-primary'}`}></div>
        ))}
    </div>
));

const BrandDetailsStep: React.FC<{
    formData: Partial<MerchantProfile>;
    handleChange: (field: keyof MerchantProfile, value: string) => void;
    t: (key: string, options?: any) => string;
}> = React.memo(({ formData, handleChange, t }) => (
    <div className="space-y-4 animate-cinematic-enter">
        <h2 className="text-xl font-bold font-serif text-text-primary">{t('merchantOnboarding.brand.title')}</h2>
        <div>
            <label className="font-medium text-text-body">{t('merchantOnboarding.brandNameLabel')}</label>
            <input type="text" value={formData.brandName || ''} onChange={e => handleChange('brandName', e.target.value)} placeholder={t('merchantOnboarding.brandNamePlaceholder')} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-border-primary"/>
        </div>
        <div>
            <label className="font-medium text-text-body">{t('merchantOnboarding.slugLabel')}</label>
            <input type="text" value={formData.slug || ''} onChange={e => handleChange('slug', e.target.value)} placeholder={t('merchantOnboarding.slugPlaceholder')} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-border-primary"/>
            <p className="text-xs text-text-secondary mt-1">{t('merchantOnboarding.brand.slugDescription')}: venty.app/shop/{formData.slug || 'your-slug'}</p>
        </div>
    </div>
));

const ContactDetailsStep: React.FC<{
    formData: Partial<MerchantProfile>;
    handleChange: (field: keyof MerchantProfile, value: string) => void;
    handleCountryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    regionData: { type: string; regions: string[] } | null;
    t: (key: string, options?: any) => string;
}> = React.memo(({ formData, handleChange, handleCountryChange, regionData, t }) => (
    <div className="space-y-4 animate-cinematic-enter">
        <h2 className="text-xl font-bold font-serif text-text-primary">{t('merchantOnboarding.contact.title')}</h2>
        <div>
            <label className="font-medium text-text-body">{t('merchantOnboarding.countryLabel')}</label>
            <select value={formData.countryCode} onChange={handleCountryChange} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-border-primary">
                {TOP_100_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.en}</option>)}
            </select>
        </div>
         {regionData && (
             <div>
                <label className="font-medium text-text-body">{regionData.type}</label>
                <select value={formData.governorate} onChange={e => handleChange('governorate', e.target.value)} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-border-primary">
                    {regionData.regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        )}
        <div>
            <label className="font-medium text-text-body">{t('merchantOnboarding.addressLabel')}</label>
            <input type="text" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder={t('merchantOnboarding.addressPlaceholder')} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-border-primary"/>
        </div>
         <div>
            <label className="font-medium text-text-body">{t('merchantOnboarding.phoneLabel')}</label>
            <input type="tel" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder={t('merchantOnboarding.phonePlaceholder')} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-border-primary"/>
        </div>
    </div>
));

const LogoStep: React.FC<{
    formData: Partial<MerchantProfile>;
    onFileSelect: (file: File | null) => void;
    t: (key: string, options?: any) => string;
}> = React.memo(({ formData, onFileSelect, t }) => (
     <div className="space-y-4 animate-cinematic-enter">
        <h2 className="text-xl font-bold font-serif text-text-primary">{t('merchantOnboarding.logo.title')}</h2>
        <ImageUpload onFileSelect={onFileSelect} currentImageUrl={formData.logoUrl}/>
    </div>
));

const SummaryStep: React.FC<{
    formData: Partial<MerchantProfile>;
    acceptedTerms: boolean;
    onAcceptTerms: (accepted: boolean) => void;
    t: (key: string, options?: any) => string;
}> = React.memo(({ formData, acceptedTerms, onAcceptTerms, t }) => (
    <div className="space-y-4 animate-cinematic-enter">
        <h2 className="text-xl font-bold font-serif text-text-primary">{t('merchantOnboarding.summaryTitle')}</h2>
        <Card className="!p-3">
            <ul className="divide-y divide-border-primary text-text-body">
                <li className="py-2 flex justify-between"><span>{t('merchantOnboarding.summaryBrand')}:</span><span className="font-semibold">{formData.brandName}</span></li>
                <li className="py-2 flex justify-between"><span>{t('merchantOnboarding.summaryPhone')}:</span><span className="font-semibold">{formData.phone}</span></li>
                <li className="py-2 flex justify-between"><span>{t('merchantOnboarding.summaryLocation')}:</span><span className="font-semibold text-right">{formData.address}, {formData.governorate}</span></li>
            </ul>
        </Card>
        <Card className="!p-3 bg-bg-primary">
            <div className="flex items-start space-x-2">
                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={() => onAcceptTerms(!acceptedTerms)} className="mt-1"/>
                <label htmlFor="terms" className="text-sm text-text-body" dangerouslySetInnerHTML={{ __html: t('merchantOnboarding.terms') }}></label>
            </div>
        </Card>
    </div>
));


// --- Main Component ---

interface MerchantOnboardingScreenProps {
    user: User;
    onComplete: (data: MerchantProfile) => void;
}

const MerchantOnboardingScreen: React.FC<MerchantOnboardingScreenProps> = ({ user, onComplete }) => {
    const { t } = useTranslation();
    const { updateUser, refreshSession } = useAuth();
    const { showToast } = useToast();
    const steps = [t('merchantOnboarding.steps.brand'), t('merchantOnboarding.steps.contact'), t('merchantOnboarding.steps.logo'), t('merchantOnboarding.steps.summary')];

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<Partial<MerchantProfile>>({
        countryCode: user.countryCode,
        governorate: '',
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [allRegions, setAllRegions] = useState<Record<string, { type: string; regions: string[] }>>({});
    const [regionData, setRegionData] = useState<{ type: string; regions: string[] } | null>(null);

    useEffect(() => {
        fetch('/locales/en/regions.json')
            .then(res => res.json())
            .then(data => setAllRegions(data))
            .catch(err => console.error("Failed to load regions data:", err));
    }, []);

    useEffect(() => {
        if (formData.countryCode && allRegions[formData.countryCode]) {
            const countryRegionsData = allRegions[formData.countryCode];
            setRegionData(countryRegionsData);
            if (!countryRegionsData.regions.includes(formData.governorate || '')) {
                // Update governorate if the current one is not in the new country's list
                 setFormData(prev => ({...prev, governorate: countryRegionsData.regions[0] || ''}));
            }
        } else {
            setRegionData(null);
        }
    }, [formData.countryCode, formData.governorate, allRegions]);
    
    useEffect(() => {
        if (!logoFile) return;
        const reader = new FileReader();
        reader.onload = () => {
            const url = typeof reader.result === 'string' ? reader.result : '';
            setFormData(prev => ({ ...prev, logoUrl: url }));
        };
        reader.readAsDataURL(logoFile);
    }, [logoFile]);

    const handleNext = () => setStep(prev => Math.min(prev + 1, steps.length - 1));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

    const handleChange = useCallback((field: keyof MerchantProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);
    
    const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountryCode = e.target.value;
        const newCountryRegions = allRegions[newCountryCode]?.regions || [];
        setFormData(prev => ({
            ...prev,
            countryCode: newCountryCode,
            governorate: newCountryRegions[0] || '',
        }));
    }, [allRegions]);

    const handleSubmit = async () => {
        const completeProfile: MerchantProfile = {
            brandName: formData.brandName || '',
            slug: formData.slug || '',
            phone: formData.phone || '',
            countryCode: formData.countryCode || '',
            governorate: formData.governorate || '',
            address: formData.address || '',
            logoUrl: formData.logoUrl || '',
        };
        let slug = completeProfile.slug || '';
        if (!slug && user.email) {
            slug = user.email.replace(/[^a-z0-9]/gi, '-');
            completeProfile.slug = slug;
        }
        if (!slug) {
            showToast('Missing merchant slug', 'error');
            return;
        }
        const payload = {
            ...completeProfile,
            storeName: completeProfile.brandName,
            ownerId: user.id,
            email: user.email,
            storeStatus: 'active'
        };
        const res = await api.updateMerchant(slug, payload);
        if (res.ok) {
            try { localStorage.setItem(`merchantTermsAccepted_${user.id}`, 'true'); } catch {}
            updateUser({ merchantProfile: completeProfile });
            await refreshSession();
            onComplete(completeProfile);
            showToast(t('common.done'), 'success');
        } else {
            showToast('Failed to save merchant profile', 'error');
        }
    };
    
    return (
        <div className="fixed inset-0 modal-backdrop backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
            <Card className="w-full max-w-lg !rounded-2xl shadow-lg !bg-bg-secondary" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <BuildingStorefrontIcon className="h-16 w-16 mx-auto text-brand-primary"/>
                    <h1 className="text-2xl font-bold mt-2 font-serif text-text-primary">{t('merchantOnboarding.title')}</h1>
                    <p className="text-text-secondary">{t('merchantOnboarding.subtitle')}</p>
                </div>

                <div className="mb-6">
                    <p className="text-center font-semibold mb-2 text-text-secondary">{steps[step]}</p>
                    <StepIndicator steps={steps} currentStep={step} />
                </div>

                <div className="min-h-[300px]">
                    {step === 0 && <BrandDetailsStep formData={formData} handleChange={handleChange} t={t} />}
                    {step === 1 && <ContactDetailsStep formData={formData} handleChange={handleChange} handleCountryChange={handleCountryChange} regionData={regionData} t={t}/>}
                    {step === 2 && <LogoStep formData={formData} onFileSelect={setLogoFile} t={t}/>}
                    {step === 3 && <SummaryStep formData={formData} acceptedTerms={acceptedTerms} onAcceptTerms={setAcceptedTerms} t={t} />}
                </div>

                 <div className="flex justify-between items-center mt-6">
                    {step > 0 ? (
                        <VentyButton onClick={handleBack} variant="secondary" className="!w-auto !py-2 !px-4"><ChevronLeftIcon className="h-5 w-5" /></VentyButton>
                    ) : <div></div>}
                    
                    {step < steps.length - 1 ? (
                        <VentyButton onClick={handleNext} variant="primary" className="!w-auto !py-2 !px-4"><ChevronRightIcon className="h-5 w-5" /></VentyButton>
                    ) : (
                        <VentyButton onClick={handleSubmit} variant="primary" disabled={!acceptedTerms}>{t('merchantOnboarding.createStoreCta')}</VentyButton>
                    )}
                </div>
            </Card>
        </div>
    );
};
export default MerchantOnboardingScreen;
