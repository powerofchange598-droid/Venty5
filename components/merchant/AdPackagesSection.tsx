
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircleIcon, StarIcon, ChartPieIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import VentyButton from '../VentyButton';
import { AdPlanId } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';

interface AdPackageInfo {
    id: AdPlanId;
    icon: React.ElementType;
    isRecommended?: boolean;
    savePercent?: number;
    price: number;
    durationDays: number;
    nameKey: string;
    durationKey: string;
    benefitsKey: string;
}

const packages: AdPackageInfo[] = [
    { id: 'basic', nameKey: 'monthlyBasic.name', durationKey: 'monthlyBasic.duration', benefitsKey: 'monthlyBasic.benefits', icon: CalendarDaysIcon, price: 5, durationDays: 30 },
    { id: 'pro', nameKey: 'monthlyPremium.name', durationKey: 'monthlyPremium.duration', benefitsKey: 'monthlyPremium.benefits', icon: StarIcon, isRecommended: true, price: 15, durationDays: 30 },
    { id: 'premium', nameKey: 'quarterlyPremium.name', durationKey: 'quarterlyPremium.duration', benefitsKey: 'quarterlyPremium.benefits', icon: ChartPieIcon, savePercent: 17, price: 25, durationDays: 90 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 260, damping: 20 },
  }),
};

const PackageCard: React.FC<{ pkg: AdPackageInfo; onSubscribe: () => void; }> = ({ pkg, onSubscribe }) => {
    const { t } = useTranslation();
    const { formatCurrency } = useLocalization();
    const titleName = t(`adPackages.packages.${pkg.nameKey}`);
    const raw = t(`adPackages.packages.${pkg.benefitsKey}`, { returnObjects: true, defaultValue: [] }) as any;
    const list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : Object.values(raw || {}));
    const benefits: string[] = list.map((b: any) => String(b || '').trim()).filter(Boolean);
    
    return (
        <div className={`relative border-2 rounded-[20px] shadow-lg flex flex-col transition-transform hover:scale-[1.03] overflow-hidden h-full ${pkg.isRecommended ? 'border-brand-primary' : 'border-border-primary'} bg-bg-secondary`}>
            {pkg.isRecommended && (
                <div className="absolute top-4 right-4 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">{t('adPackages.recommended')}</div>
            )}
            {!!pkg.savePercent && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">Save {pkg.savePercent}%</div>
            )}
             <div className="p-8 flex-grow">
                <pkg.icon className={`h-10 w-10 mb-4 ${pkg.isRecommended ? 'text-brand-primary' : 'text-text-secondary'}`} />
                <h3 className="text-xl font-bold text-text-primary">{titleName}</h3>
                <p className="mt-2">
                    <span className="text-4xl font-bold text-text-primary">{formatCurrency(pkg.price)}</span>
                    <span className="text-text-secondary">{t(`adPackages.packages.${pkg.durationKey}`)}</span>
                </p>
                <ul className="mt-8 space-y-3 text-left text-text-primary">
                    {benefits.length === 0 ? (
                        <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-6 w-6 flex-shrink-0 mt-0.5 text-text-tertiary" />
                            <span className="text-text-tertiary">—</span>
                        </li>
                    ) : benefits.map((benefit, index) => {
                        const b = String(benefit || '');
                        const isNegative = /^no\s/i.test(b) || /^\u0644\u0627\s/i.test(b);
                        const cleanText = b
                            .replace(/^(no|yes)\s+/i, '')
                            .replace(/^(?:\u0646\u0639\u0645|\u0644\u0627)\s+/i, '');
                        return (
                            <li key={index} className="flex items-start space-x-3">
                                <CheckCircleIcon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${isNegative ? 'text-text-tertiary' : 'text-feedback-success'}`} />
                                <span className={isNegative ? 'text-text-tertiary' : 'text-text-secondary'}>{cleanText}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="p-6 mt-auto">
                 <VentyButton 
                    onClick={onSubscribe} 
                    variant={pkg.isRecommended ? 'primary' : 'secondary'}
                    className="w-full !rounded-lg !py-3"
                    aria-label={`Subscribe to ${titleName}`}
                >
                    {t('adPackages.subscribe')}
                </VentyButton>
            </div>
        </div>
    );
};

const AdPackagesSection: React.FC<{ onSubscribe: (plan: { id: AdPlanId; name: string; price: number; durationDays: number }) => void }> = ({ onSubscribe }) => {
    const { t } = useTranslation();
    
    const handleSubscribeClick = (pkg: AdPackageInfo) => {
        onSubscribe({
            id: pkg.id,
            name: t(`adPackages.packages.${pkg.nameKey}`),
            price: pkg.price,
            durationDays: pkg.durationDays,
        });
    };

    return (
        <div className="bg-bg-primary p-4 sm:p-6 rounded-xl">
            <h2 className="text-3xl font-bold text-center text-text-primary">{t('adPackages.title')}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {packages.map((pkg, i) => (
                    <motion.div key={pkg.id} custom={i} initial="hidden" animate="visible" variants={cardVariants as any}>
                        <PackageCard pkg={pkg} onSubscribe={() => handleSubscribeClick(pkg)} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AdPackagesSection;
