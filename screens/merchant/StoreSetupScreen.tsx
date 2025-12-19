import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, StoreConfig, Product } from '../../types';
import { useToast } from '../../hooks/useToast';
import { mockProducts } from '../../data/mockData';
import { themes } from '../../data/merchantThemes';
import MerchantPageLayout from '../../components/merchant/MerchantPageLayout';
import Card from '../../components/Card';
import VentyButton from '../../components/VentyButton';
import ImageUpload from '../../components/ImageUpload';
import StorePreview from '../../components/merchant/setup/StorePreview';
import EditorAccordion from '../../components/merchant/setup/EditorAccordion';
import { ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';

// --- PROPS ---
interface StoreSetupScreenProps {
    user: User;
    onSave: (config: StoreConfig) => void;
}

// --- EDITOR COMPONENTS ---
// Co-located here for simplicity as they are specific to this screen's new design.

const StoreInfoEditor: React.FC<{
    branding: StoreConfig['branding'];
    onBrandingChange: (key: keyof StoreConfig['branding'], value: any) => void;
    onLogoChange: (url: string) => void;
}> = ({ branding, onBrandingChange, onLogoChange }) => (
    <div>
        <div className="mb-4">
            <label className="font-medium text-sm">Store Name</label>
            <input type="text" value={branding.storeName} onChange={e => onBrandingChange('storeName', e.target.value)} className="w-full mt-1"/>
        </div>
        <div>
            <label className="font-medium text-sm block mb-2">Store Logo</label>
            <ImageUpload 
                onFileSelect={(file) => file && onLogoChange(URL.createObjectURL(file))} 
                currentImageUrl={(branding as any).logoUrl} // Assuming logoUrl is part of branding
            />
        </div>
    </div>
);

const HeroBannerEditor: React.FC<{
    hero: StoreConfig['hero'];
    onHeroChange: (key: keyof StoreConfig['hero'], value: any) => void;
}> = ({ hero, onHeroChange }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <label className="font-medium text-sm">Enable Hero Banner</label>
            <input type="checkbox" checked={hero.isEnabled} onChange={e => onHeroChange('isEnabled', e.target.checked)} className="ios-switch"/>
        </div>
        <AnimatePresence>
            {hero.isEnabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <div>
                        <label className="font-medium text-sm">Banner Image URL</label>
                        <input type="text" value={hero.imageUrl} onChange={e => onHeroChange('imageUrl', e.target.value)} placeholder="https://..." className="w-full mt-1"/>
                    </div>
                    <div>
                        <label className="font-medium text-sm">Headline</label>
                        <input type="text" value={hero.headline} onChange={e => onHeroChange('headline', e.target.value)} placeholder="Welcome to my store" className="w-full mt-1"/>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const ThemeEditor: React.FC<{
    branding: StoreConfig['branding'];
    onPaletteChange: (key: keyof StoreConfig['branding']['palette'], value: string) => void;
    onFontChange: (value: StoreConfig['branding']['fontPair']) => void;
}> = ({ branding, onPaletteChange, onFontChange }) => (
    <div className="space-y-4">
        <div>
            <label className="font-medium text-sm">Color Palette</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
                {Object.entries(branding.palette).map(([key, value]) => (
                    <div key={key}>
                        <label className="text-xs capitalize">{key}</label>
                        <input type="color" value={value} onChange={e => onPaletteChange(key as any, e.target.value)} className="w-full h-8 mt-1 p-0 border-none cursor-pointer rounded"/>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <label className="font-medium text-sm">Font Style</label>
            <select value={branding.fontPair} onChange={e => onFontChange(e.target.value as any)} className="w-full mt-1">
                <option value="Modern">Modern (Sans-Serif)</option>
                <option value="Classic">Classic (Serif)</option>
                <option value="Playful">Playful (Mono)</option>
            </select>
        </div>
    </div>
);

const LayoutEditor: React.FC<{
    layout: StoreConfig['layout'];
    onLayoutChange: (key: keyof StoreConfig['layout'], value: any) => void;
}> = ({ layout, onLayoutChange }) => (
    <div className="space-y-4">
        <div>
            <label className="font-medium text-sm">Product Card Style</label>
            <select value={layout.cardStyle} onChange={e => onLayoutChange('cardStyle', e.target.value)} className="w-full mt-1">
                <option value="hard-shadow">Hard Shadow</option>
                <option value="soft-shadow">Soft Shadow</option>
                <option value="border">Border</option>
            </select>
        </div>
        <div>
            <label className="font-medium text-sm">Grid Style</label>
            <select value={layout.gridStyle} onChange={e => onLayoutChange('gridStyle', e.target.value)} className="w-full mt-1">
                <option value="2x2">2x2 Grid</option>
                <option value="3x3">3x3 Grid</option>
                <option value="list">List</option>
            </select>
        </div>
    </div>
);

// --- MAIN SCREEN COMPONENT ---

const StoreSetupScreen: React.FC<StoreSetupScreenProps> = ({ user, onSave }) => {
    const { showToast } = useToast();
    type OpenAccordion = 'info' | 'hero' | 'theme' | 'layout' | null;
    const [openAccordion, setOpenAccordion] = useState<OpenAccordion>('info');
    
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>(() => mockProducts.slice(0, 4));

    const initialStoreConfig = useMemo(() => {
        const defaultTheme = themes.find(t => t.id === 'dark')!;
        return user.merchantProfile?.storeConfig 
            ? { ...defaultTheme.config, ...user.merchantProfile.storeConfig }
            : defaultTheme.config;
    }, [user.merchantProfile]);

    const [config, setConfig] = useState<StoreConfig>(initialStoreConfig);
    
    const handleConfigChange = useCallback(<K extends keyof StoreConfig>(key: K, value: StoreConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleBrandingChange = useCallback(<K extends keyof StoreConfig['branding']>(key: K, value: StoreConfig['branding'][K]) => {
        handleConfigChange('branding', { ...config.branding, [key]: value });
    }, [config.branding, handleConfigChange]);

    const handleHeroChange = useCallback(<K extends keyof StoreConfig['hero']>(key: K, value: StoreConfig['hero'][K]) => {
        handleConfigChange('hero', { ...config.hero, [key]: value });
    }, [config.hero, handleConfigChange]);

    const handleLayoutChange = useCallback(<K extends keyof StoreConfig['layout']>(key: K, value: StoreConfig['layout'][K]) => {
        handleConfigChange('layout', { ...config.layout, [key]: value });
    }, [config.layout, handleConfigChange]);
    
    const handleSave = () => {
        onSave(config);
        showToast("Store design saved successfully!", 'success');
    };
    
    return (
        <MerchantPageLayout title="Store Customizer">
            <div className="store-setup-layout">
                {/* Left Panel: Form */}
                <div className="form-panel">
                    <EditorAccordion title="Store Info" isOpen={openAccordion === 'info'} onToggle={() => setOpenAccordion(openAccordion === 'info' ? null : 'info')}>
                        <StoreInfoEditor 
                            branding={config.branding}
                            onBrandingChange={handleBrandingChange}
                            onLogoChange={(url) => handleBrandingChange('logoUrl' as any, url)}
                        />
                    </EditorAccordion>
                    <EditorAccordion title="Hero Banner" isOpen={openAccordion === 'hero'} onToggle={() => setOpenAccordion(openAccordion === 'hero' ? null : 'hero')}>
                        <HeroBannerEditor hero={config.hero} onHeroChange={handleHeroChange} />
                    </EditorAccordion>
                     <EditorAccordion title="Theme & Branding" isOpen={openAccordion === 'theme'} onToggle={() => setOpenAccordion(openAccordion === 'theme' ? null : 'theme')}>
                        <ThemeEditor 
                            branding={config.branding}
                            onPaletteChange={(key, value) => handleBrandingChange('palette', {...config.branding.palette, [key]: value})}
                            onFontChange={(value) => handleBrandingChange('fontPair', value)}
                        />
                    </EditorAccordion>
                    <EditorAccordion title="Layout" isOpen={openAccordion === 'layout'} onToggle={() => setOpenAccordion(openAccordion === 'layout' ? null : 'layout')}>
                        <LayoutEditor layout={config.layout} onLayoutChange={handleLayoutChange} />
                    </EditorAccordion>
                </div>

                {/* Right Panel: Preview */}
                <div className="preview-panel">
                    <div className="device-toggle">
                        <button onClick={() => setPreviewMode('desktop')} className={previewMode === 'desktop' ? 'active' : ''}><ComputerDesktopIcon className="h-5 w-5 inline-block mr-1"/> Desktop</button>
                        <button onClick={() => setPreviewMode('mobile')} className={previewMode === 'mobile' ? 'active' : ''}><DevicePhoneMobileIcon className="h-5 w-5 inline-block mr-1"/> Mobile</button>
                    </div>
                    <StorePreview config={config} products={featuredProducts} viewMode={previewMode} user={user} />
                </div>
            </div>
            
            <div className="save-bar">
                <VentyButton onClick={handleSave} variant="primary">Save & Publish</VentyButton>
            </div>
        </MerchantPageLayout>
    );
};

export default StoreSetupScreen;
