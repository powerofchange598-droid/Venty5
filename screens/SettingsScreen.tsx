
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import {
    UserCircleIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon, PaintBrushIcon, TrashIcon,
    CreditCardIcon, QuestionMarkCircleIcon, WrenchScrewdriverIcon, ArrowPathIcon,
    ChevronRightIcon, ExclamationTriangleIcon, StarIcon, GlobeAltIcon, SunIcon, BoltIcon
} from '@heroicons/react/24/outline';
import PageLayout from '../components/PageLayout';
import VentyButton from '../components/VentyButton';
import Card from '../components/Card';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../hooks/useTheme';
import { usePerformance } from '../hooks/usePerformance';
import VerifiedBadge from '../components/VerifiedBadge';
import PremiumBadge from '../components/PremiumBadge';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { useLocalization } from '../hooks/useLocalization';
import { useToast } from '../hooks/useToast';
import ThemeToggle from '../components/ThemeToggle';
import { useTranslation } from 'react-i18next';
import { TOP_100_COUNTRIES, CountryData } from '../data/TOP_100_COUNTRIES';
import { COUNTRY_CURRENCY } from '../data/currencyData';
import SelectorModal from '../components/SelectorModal';
import { AVAILABLE_LANGUAGES } from '../data/LangTop100';
import { useDetectCountry } from '../hooks/useDetectCountry';
import { XMarkIcon as XSolid } from '@heroicons/react/24/solid';
import MerchantVerificationCard from '../components/merchant/MerchantVerificationCard';

// --- PROPS ---
interface SettingsScreenProps {
    user: User;
    setUser: (user: User) => void;
    isPremiumUser: boolean;
    onSwitchUser: () => void;
    onLogout: () => void;
    onDeleteAccount: () => void;
    onUpgrade: () => void;
}

// --- MOTION VARIANTS ---
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 }};
const modalVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } }, exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } } };

// --- HELPER & MODAL COMPONENTS ---

const PerformanceToggle: React.FC<{ enabled: boolean; onChange: () => void; disabled?: boolean }> = ({ enabled, onChange, disabled = false }) => (
    <label className="ios-switch">
        <input type="checkbox" checked={enabled} onChange={!disabled ? onChange : undefined} disabled={disabled} />
        <span className="slider"></span>
    </label>
);

const SettingsItem: React.FC<{ label: string; value?: React.ReactNode; onClick?: () => void; children?: React.ReactNode; disabled?: boolean; title?: string; hasNav?: boolean }> = ({ label, value, onClick, children, disabled = false, title, hasNav = true }) => (
    <div
        onClick={!disabled ? onClick : undefined}
        className={`settings-row flex items-center justify-between py-4 ${onClick && !disabled ? 'cursor-pointer group' : ''} ${disabled ? 'opacity-50' : ''}`}
        title={title}
        role={onClick && !disabled ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
    >
        <p className="font-medium text-text-primary">{label}</p>
        <div className="flex items-center space-x-2">
            {value && <div className="text-text-secondary group-hover:text-brand-primary">{value}</div>}
            {children}
            {onClick && !disabled && hasNav && <ChevronRightIcon className="h-5 w-5 text-text-tertiary" />}
        </div>
    </div>
);

const ConfirmationModal: React.FC<{
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    isDestructive?: boolean;
}> = ({ onClose, onConfirm, title, message, confirmText, isDestructive = false }) => {
    const { t } = useTranslation();
    return (
        <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-[60]" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
            <motion.div className="bg-bg-secondary rounded-xl shadow-lg w-full max-w-sm p-6 text-center" variants={modalVariants as any} onClick={e => e.stopPropagation()}>
                {isDestructive && <ExclamationTriangleIcon className="h-12 w-12 text-feedback-error mx-auto mb-4" />}
                <h2 className={`text-xl font-bold ${isDestructive ? 'text-feedback-error' : 'text-text-primary'}`}>{title}</h2>
                <p className="my-4 text-text-body">{message}</p>
                <div className="flex gap-2">
                    <VentyButton onClick={onClose} variant="secondary" label={t('common.cancel')}></VentyButton>
                    <VentyButton onClick={onConfirm} variant={isDestructive ? 'danger' : 'primary'} label={confirmText}></VentyButton>
                </div>
            </motion.div>
        </motion.div>
    );
};

const EditProfileModal: React.FC<{ user: User; setUser: (u: User) => void; onClose: () => void }> = ({ user, setUser, onClose }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [age, setAge] = useState(user.age || '');
    const [occupation, setOccupation] = useState(user.occupation || '');
    const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setUser({ ...user, name, email, profilePictureUrl, age: Number(age) || undefined, occupation: occupation || undefined });
            setIsSaving(false);
            onClose();
        }, 1000);
    };

    const { t } = useTranslation();
    return (
         <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-[60]" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
            <motion.div className="bg-bg-secondary rounded-xl shadow-lg w-full max-w-md p-6" variants={modalVariants as any} onClick={e => e.stopPropagation()}>
                 <h2 className="text-xl font-bold mb-4 text-text-primary">{t('settings.labels.editProfile')}</h2>
                 <div className="space-y-4">
                     <ImageUpload onFileSelect={(file) => {
                         if (!file) return;
                         const reader = new FileReader();
                         reader.onload = () => setProfilePictureUrl(typeof reader.result === 'string' ? reader.result : '');
                         reader.readAsDataURL(file);
                     }} currentImageUrl={profilePictureUrl} />
                    <div>
                        <label className="font-medium text-sm text-text-body">{t('settings.name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1" />
                    </div>
                     <div>
                        <label className="font-medium text-sm text-text-body">{t('settings.email')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1" />
                    </div>
                     <div>
                        <label className="font-medium text-sm text-text-body">{t('settings.labels.password')}</label>
                        <input type="password" placeholder="••••••••" className="w-full mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium text-sm text-text-body">{t('settings.labels.ageOptional')}</label>
                            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g., 30" className="w-full mt-1" />
                        </div>
                        <div>
                            <label className="font-medium text-sm text-text-body">{t('settings.labels.occupationOptional')}</label>
                            <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g., Designer" className="w-full mt-1" />
                        </div>
                    </div>
                 </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <VentyButton onClick={onClose} variant="secondary" label={t('common.cancel')}></VentyButton>
                    <VentyButton onClick={handleSave} disabled={isSaving} label={isSaving ? t('common.loading') : t('common.save')} variant="primary"></VentyButton>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MAIN SCREEN COMPONENT ---
const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, setUser, isPremiumUser, onSwitchUser, onLogout, onDeleteAccount, onUpgrade }) => {
    const navigate = useNavigate();
    const [modal, setModal] = useState<'logout' | 'delete' | 'editProfile' | null>(null);
    const { performanceMode, setPerformanceMode } = usePerformance();
    const { t, i18n } = useTranslation();
    const { currency, setCurrency } = useLocalization();
    const [country, setCountry] = useState<CountryData | null>(() => {
        const saved = localStorage.getItem('ventyCountry');
        const found = saved ? TOP_100_COUNTRIES.find(c => c.code === saved) || null : null;
        return found;
    });
    const { detectedCode } = useDetectCountry();
    const [langOpen, setLangOpen] = useState(false);
    const [countryOpen, setCountryOpen] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [backendEnv, setBackendEnv] = useState<string>('');

    const handleLangSelect = (_code: string) => {
        setLangOpen(false);
    };

    const handleCountryChange = (newValue: CountryData | null) => {
        setCountry(newValue);
        const code = newValue?.code || '';
        if (code) {
            localStorage.setItem('ventyCountry', code);
            const c = COUNTRY_CURRENCY[code];
            if (c) setCurrency(c.code);
        }
        setCountryOpen(false);
    };

    const handleCurrencySelect = (code: string) => {
        setCurrency(code);
        setCurrencyOpen(false);
    };

    const languageItems = [{ key: 'en', label: 'English' }];
    const countryItems = useMemo(() => {
        const arr = [...TOP_100_COUNTRIES];
        arr.sort((a, b) => {
            if (detectedCode && (a.code === detectedCode || b.code === detectedCode)) {
                if (a.code === detectedCode) return -1;
                if (b.code === detectedCode) return 1;
            }
            return a.en.localeCompare(b.en);
        });
        return arr.map(c => ({ key: c.code, label: c.en, icon: <span className="text-lg opacity-70">{c.flag}</span> }));
    }, [detectedCode]);
    const currencyItems = useMemo(() => {
        return Object.values(COUNTRY_CURRENCY).reduce((unique: { code: string; symbol: string; nameEn: string }[], cur) => {
            if (!unique.some(u => u.code === cur.code)) unique.push(cur);
            return unique;
        }, []).sort((a, b) => a.nameEn.localeCompare(b.nameEn)).map(c => ({ key: c.code, label: `${c.symbol} ${c.code} – ${c.nameEn}` }));
    }, []);
    
    React.useEffect(() => {
        let cancelled = false;
        const ping = async () => {
            try {
                const resp = await fetch(`/api/health`);
                const data = await resp.json().catch(() => ({}));
                if (!cancelled) {
                    setBackendStatus(resp.ok ? 'online' : 'offline');
                    setBackendEnv(data?.env || '');
                }
            } catch {
                if (!cancelled) {
                    setBackendStatus('offline');
                    setBackendEnv('');
                }
            }
        };
        ping();
        const id = setInterval(ping, 15000);
        return () => { cancelled = true; clearInterval(id); };
    }, []);
    
    return (
        <PageLayout title={t('settings.title')}>
             <AnimatePresence>
                {modal === 'logout' && <ConfirmationModal title={t('settings.logout.confirmTitle')} message={t('settings.logout.confirmMessage')} confirmText={t('settings.logout.button')} onConfirm={onLogout} onClose={() => setModal(null)} />}
                {modal === 'delete' && <ConfirmationModal title={t('settings.labels.deleteAccount')} message={t('settings.privacy.deleteConfirmMessage', 'Are you sure you want to permanently delete your account? This action cannot be undone.')} confirmText={t('settings.privacy.deleteCta')} isDestructive onConfirm={onDeleteAccount} onClose={() => setModal(null)} />}
                {modal === 'editProfile' && <EditProfileModal user={user} setUser={setUser} onClose={() => setModal(null)} />}
             </AnimatePresence>
            <div className="py-6 space-y-6 max-w-2xl mx-auto px-4">
                <Card>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary mb-2">
                        <UserCircleIcon className="h-4 w-4 text-text-secondary" />
                        <h2 className="text-xs font-semibold text-text-secondary uppercase">{t('settings.sections.account')}</h2>
                    </div>
                    <div className="divide-y divide-border-primary">
                        <SettingsItem label={t('settings.labels.editProfile')} onClick={() => setModal('editProfile')} hasNav>
                            <UserCircleIcon className="h-4 w-4 text-text-tertiary" />
                        </SettingsItem>
                        <SettingsItem label={t('settings.labels.paymentHistory')} onClick={() => navigate('/payment-history')} hasNav>
                            <CreditCardIcon className="h-4 w-4 text-text-tertiary" />
                        </SettingsItem>
                    </div>
                </Card>

                <Card>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary mb-2">
                        <StarIcon className="h-4 w-4 text-text-secondary" />
                        <h2 className="text-xs font-semibold text-text-secondary uppercase">{t('settings.sections.subscriptions')}</h2>
                    </div>
                    <div className="divide-y divide-border-primary">
                         <SettingsItem label={t('settings.labels.ventyPremium')} hasNav={!isPremiumUser} onClick={!isPremiumUser ? onUpgrade : undefined}>
                            {isPremiumUser ? (
                                <span className="text-sm font-semibold text-brand-primary">{t('settings.labels.active')}</span>
                            ) : (
                                <VentyButton onClick={onUpgrade} variant="primary" className="!w-auto !px-3 !py-1.5 !text-sm" label={t('settings.labels.upgrade')} />
                            )}
                         </SettingsItem>
                        {user.accountType === 'merchant' && (
                           <SettingsItem label={t('settings.labels.adSubscription')} onClick={() => navigate('/marketing')}>
                               {user.merchantProfile?.subscription ? <span className="text-sm font-semibold text-brand-primary">{user.merchantProfile.subscription.name}</span> : <span>{t('settings.labels.subscribe')}</span>}
                           </SettingsItem>
                        )}
                    </div>
                </Card>
                
                {user.accountType === 'merchant' && !user.merchantProfile?.isVerified && (
                    <Card className="!p-4">
                        <h2 className="text-xl font-serif font-bold mb-3">Grow Your Business</h2>
                        <MerchantVerificationCard user={user} />
                    </Card>
                )}
                
                <Card>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary mb-2">
                        <PaintBrushIcon className="h-4 w-4 text-text-secondary" />
                        <h2 className="text-xs font-semibold text-text-secondary uppercase">{t('settings.sections.appSettings')}</h2>
                    </div>
                    <div className="divide-y divide-border-primary">
                        <SettingsItem label={t('settings.labels.appearance')} hasNav={false}>
                            <ThemeToggle />
                        </SettingsItem>
                        <SettingsItem label="Payment Backend" hasNav={false} title="PayPal & promo codes service">
                            <span className={`text-sm font-semibold ${backendStatus === 'online' ? 'text-feedback-success' : backendStatus === 'checking' ? 'text-text-secondary' : 'text-feedback-error'}`}>
                                {backendStatus === 'online' ? `Online${backendEnv ? ` • ${backendEnv}` : ''}` : backendStatus === 'checking' ? 'Checking…' : 'Offline'}
                            </span>
                        </SettingsItem>
                        <SettingsItem label="Language" hasNav={false}>
                            <span className="text-sm">English</span>
                        </SettingsItem>
                        <SettingsItem label={t('settings.country')} hasNav={false} onClick={() => setCountryOpen(true)}>
                            <span className="text-sm">{country ? `${country.en}` : 'United States'}</span>
                        </SettingsItem>
                        <SettingsItem label={t('settings.currency')} hasNav={false} onClick={() => setCurrencyOpen(true)}>
                            <span className="text-sm">{currencyItems.find(c => c.key === currency)?.label || '$ USD – US Dollar'}</span>
                        </SettingsItem>
                        <SettingsItem label={t('settings.labels.highPerformanceMode')} hasNav={false} title={t('settings.labels.performanceHint')}>
                            <PerformanceToggle enabled={performanceMode === 'performance'} onChange={() => setPerformanceMode(performanceMode === 'performance' ? 'normal' : 'performance')} />
                        </SettingsItem>
                    </div>
                </Card>

                

                
                <SelectorModal
                    isOpen={countryOpen}
                    title={t('settings.modals.selectCountry')}
                    items={countryItems}
                    initialSelectedKey={country?.code}
                    onClose={() => setCountryOpen(false)}
                    onSelect={(code) => handleCountryChange(TOP_100_COUNTRIES.find(c => c.code === code) || null)}
                    placeholder={t('settings.modals.searchCountries')}
                />
                <SelectorModal
                    isOpen={currencyOpen}
                    title={t('settings.modals.selectCurrency')}
                    items={currencyItems}
                    initialSelectedKey={currency}
                    onClose={() => setCurrencyOpen(false)}
                    onSelect={handleCurrencySelect}
                    placeholder={t('settings.modals.searchCurrencies')}
                />

                <Card>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary mb-2">
                        <QuestionMarkCircleIcon className="h-4 w-4 text-text-secondary" />
                        <h2 className="text-xs font-semibold text-text-secondary uppercase">{t('settings.sections.communitySupport')}</h2>
                    </div>
                    <div className="divide-y divide-border-primary">
                        <SettingsItem label={t('settings.labels.referAFriend')} onClick={() => navigate('/referral')} />
                        <SettingsItem label={t('settings.labels.helpCenterSupport')} onClick={() => navigate('/support')} />
                    </div>
                </Card>

                <Card>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary mb-2">
                        <WrenchScrewdriverIcon className="h-4 w-4 text-text-secondary" />
                        <h2 className="text-xs font-semibold text-text-secondary uppercase">{t('settings.sections.general')}</h2>
                    </div>
                    <div className="divide-y divide-border-primary">
                         <SettingsItem 
                            label={user.accountType === 'merchant' ? t('settings.labels.switchToPersonal') : t('settings.labels.switchToMerchant')} 
                            onClick={onSwitchUser} 
                         />
                    </div>
                </Card>

                <div className="space-y-4 pt-4">
                    <VentyButton onClick={() => setModal('logout')} variant="secondary" label={t('settings.logout.button')} />
                    <VentyButton onClick={() => setModal('delete')} variant="danger" label={t('settings.labels.deleteAccount')} />
                </div>
            </div>
        </PageLayout>
    );
};

export default SettingsScreen;
