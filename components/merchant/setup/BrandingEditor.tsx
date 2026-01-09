

import React from 'react';
import { StoreConfig } from '../../../types';
import ImageUpload from '../../../components/ImageUpload';

interface BrandingEditorProps {
    currentConfig: StoreConfig;
    onSave: (newConfig: Partial<StoreConfig>) => void;
}

const fontOptions: { id: StoreConfig['branding']['fontPair'], label: string }[] = [
    { id: 'Modern', label: 'Modern (Sans-Serif)' },
    { id: 'Classic', label: 'Classic (Serif)' },
    { id: 'Playful', label: 'Playful (Mono)' },
];

const BrandingEditor: React.FC<BrandingEditorProps> = ({ currentConfig, onSave }) => {
    const [branding, setBranding] = React.useState(currentConfig.branding);
    const [logoUrl, setLogoUrl] = React.useState(''); 

    const handleBrandingChange = <K extends keyof StoreConfig['branding']>(key: K, value: StoreConfig['branding'][K]) => {
        const newBranding = { ...branding, [key]: value };
        setBranding(newBranding);
        onSave({ branding: newBranding });
    };
    
    const handleColorChange = (colorKey: keyof StoreConfig['branding']['palette'], value: string) => {
        const newPalette = { ...branding.palette, [colorKey]: value };
        handleBrandingChange('palette', newPalette);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="font-medium text-sm">Store Name</label>
                <input type="text" value={branding.storeName} onChange={e => handleBrandingChange('storeName', e.target.value)} className="w-full mt-1"/>
            </div>
            <div>
                <label className="font-medium text-sm block mb-2">Store Logo</label>
                <ImageUpload onFileSelect={async (file) => {
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                        if (!dataUrl) return;
                        try {
                            const resp = await fetch(`/api/assets/upload`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ dataUrl, filename: file.name }),
                            });
                            const json = await resp.json();
                            if (resp.ok && json?.ok && json?.url) {
                                setLogoUrl(json.url);
                                handleBrandingChange('logoUrl', json.url as any);
                            }
                        } catch {}
                    };
                    reader.readAsDataURL(file);
                }} currentImageUrl={logoUrl} />
            </div>
            <div>
                <label className="font-medium text-sm">Font Pair</label>
                <select value={branding.fontPair} onChange={e => handleBrandingChange('fontPair', e.target.value as any)} className="w-full mt-1">
                    {fontOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
            </div>
            <div>
                <label className="font-medium text-sm">Color Palette</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                    {Object.entries(branding.palette).map(([key, value]) => (
                        <div key={key}>
                            <label className="text-xs capitalize">{key}</label>
                            <input type="color" value={value} onChange={e => handleColorChange(key as any, e.target.value)} className="w-full h-8 mt-1 p-0 border-none cursor-pointer rounded"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandingEditor;
