



import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, StoreConfig } from '../types';
import { useTranslation } from 'react-i18next';
import {
    PaintBrushIcon, SparklesIcon, CreditCardIcon, GlobeAltIcon, DocumentTextIcon, BellIcon
} from '@heroicons/react/24/outline';

import SetupProgress from '../components/merchant/setup/SetupProgress';
import SetupDetailPanel from '../components/merchant/setup/SetupDetailPanel';
import ThemeEditor from '../components/merchant/setup/ThemeEditor';
import BrandingEditor from '../components/merchant/setup/BrandingEditor';
import PaymentEditor from '../components/merchant/setup/PaymentEditor';
import DomainEditor from '../components/merchant/setup/DomainEditor';
import PoliciesEditor from '../components/merchant/setup/PoliciesEditor';
import NotificationsEditor from '../components/merchant/setup/NotificationsEditor';
import VentyButton from '../components/VentyButton';
import MerchantPageLayout from '../components/merchant/MerchantPageLayout';

interface StoreSetupScreenProps {
    user: User;
    onSave: (config: StoreConfig) => void;
}

type SetupTask = 'theme' | 'branding' | 'payment' | 'domain' | 'policies' | 'notifications';

const setupCategories: { id: SetupTask; title: string; description: string; icon: React.ElementType }[] = [
    { id: 'theme', title: 'Choose a Theme', description: 'Select a template to define the look and feel of your online store.', icon: PaintBrushIcon },
    { id: 'branding', title: 'Branding & Logo', description: 'Upload your logo and customize your store’s colors and typography.', icon: SparklesIcon },
    { id: 'payment', title: 'Set Up Payments', description: 'Configure how you’ll accept payments from your customers.', icon: CreditCardIcon },
    { id: 'domain', title: 'Connect Domain', description: 'Add a custom domain name to your store for a professional look.', icon: GlobeAltIcon },
    { id: 'policies', title: 'Add Store Policies', description: 'Set up your refund, privacy, and shipping policies.', icon: DocumentTextIcon },
    { id: 'notifications', title: 'Configure Notifications', description: 'Customize the email notifications sent to your customers.', icon: BellIcon },
];

const StoreSetupScreen: React.FC<StoreSetupScreenProps> = ({ user, onSave }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<SetupTask | null>(null);

    const [setupState, setSetupState] = useState({
        theme: !!user.merchantProfile?.storeConfig,
        branding: !!user.merchantProfile?.logoUrl && !!user.merchantProfile?.brandName,
        payment: false,
        domain: false,
        policies: false,
        notifications: false,
    });
    
    const initialStoreConfig: StoreConfig = useMemo(() => {
        const defaultThemeConfig = {
            branding: {
                storeName: user.merchantProfile?.brandName || 'Your Store',
                fontPair: 'Modern' as const,
                palette: { primary: '#111827', secondary: '#e5e7eb', accent: '#d1d5db', background: '#ffffff', text: '#1f2937' },
            },
            hero: { isEnabled: false, imageUrl: '', headline: '', subtitle: '', ctaText: '' },
            layout: { cardStyle: 'border' as const, spacing: 'tight' as const, gridStyle: '3x3' as const, cardBorderRadius: 'sharp' as const },
            sections: [],
        };
        return user.merchantProfile?.storeConfig ? { ...defaultThemeConfig, ...user.merchantProfile.storeConfig } : defaultThemeConfig;
    }, [user.merchantProfile]);

    const [config, setConfig] = useState<StoreConfig>(initialStoreConfig);
    
    const updateSetupState = useCallback((task: SetupTask, isComplete: boolean, newConfig?: Partial<StoreConfig>) => {
        setSetupState(prev => ({ ...prev, [task]: isComplete }));
        if (newConfig) {
            setConfig(prev => ({ ...prev, ...newConfig }));
        }
        setActiveSection(null);
    }, []);

    const progressPercentage = useMemo(() => {
        const completedTasks = Object.values(setupState).filter(Boolean).length;
        const totalTasks = Object.keys(setupState).length;
        return (completedTasks / totalTasks) * 100;
    }, [setupState]);

    const renderDetailPanel = () => {
        switch (activeSection) {
            case 'theme': return <ThemeEditor user={user} currentConfig={config} onSave={(newThemeConfig) => updateSetupState('theme', true, newThemeConfig)} />;
            // FIX: Removed the 'user' prop from BrandingEditor as it is not defined in its props.
            case 'branding': return <BrandingEditor currentConfig={config} onSave={(newBrandingConfig) => updateSetupState('branding', true, newBrandingConfig)} />;
            case 'payment': return <PaymentEditor onSave={() => updateSetupState('payment', true)} />;
            case 'domain': return <DomainEditor onSave={() => updateSetupState('domain', true)} />;
            case 'policies': return <PoliciesEditor onSave={() => updateSetupState('policies', true)} />;
            case 'notifications': return <NotificationsEditor onSave={() => updateSetupState('notifications', true)} />;
            default: return null;
        }
    };
    
    return (
        <MerchantPageLayout title="Store Setup">
            <div className="h-full flex flex-col">
                <main className="flex-grow scroll-area p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <SetupProgress progress={progressPercentage} tasks={setupCategories.map(cat => ({ id: cat.id, label: cat.title, completed: setupState[cat.id] }))} />
                        
                        <div className="setup-dashboard-grid mt-8">
                            {setupCategories.map(({ id, title, description, icon: Icon }) => (
                                <div key={id} className="setup-category-card">
                                    <div className="flex-grow">
                                        <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4">
                                            <Icon className="h-6 w-6 text-brand-primary" />
                                        </div>
                                        <h3 className="font-bold text-lg">{title}</h3>
                                        <p className="text-sm text-text-secondary mt-1">{description}</p>
                                    </div>
                                    <div className="mt-6">
                                        <VentyButton variant="secondary" className="!w-auto !py-2 !px-4 !text-sm" onClick={() => setActiveSection(id)} label={setupState[id] ? 'Edit' : 'Set Up'}>
                                        </VentyButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                <AnimatePresence>
                    {activeSection && (
                        <SetupDetailPanel
                            title={setupCategories.find(c => c.id === activeSection)?.title || 'Settings'}
                            onClose={() => setActiveSection(null)}
                        >
                            {renderDetailPanel()}
                        </SetupDetailPanel>
                    )}
                </AnimatePresence>
            </div>
        </MerchantPageLayout>
    );
};

export default StoreSetupScreen;
