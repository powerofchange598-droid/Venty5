import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VentyButton from '../components/VentyButton';
import {
    HomeIcon, TruckIcon, ShoppingCartIcon, TvIcon, HeartIcon, BuildingStorefrontIcon, AcademicCapIcon, BanknotesIcon
} from '@heroicons/react/24/outline';

// --- DATA & TYPES ---
type Option = { id: string; label: string; icon: React.ElementType };

const spendingOptions: Option[] = [
    { id: 'housing', label: 'Housing', icon: HomeIcon },
    { id: 'food', label: 'Food', icon: ShoppingCartIcon },
    { id: 'transport', label: 'Transport', icon: TruckIcon },
    { id: 'entertainment', label: 'Entertainment', icon: TvIcon },
    { id: 'subscriptions', label: 'Subscriptions', icon: TvIcon },
    { id: 'health', label: 'Health', icon: HeartIcon },
    { id: 'shopping', label: 'Shopping', icon: BuildingStorefrontIcon },
    { id: 'education', label: 'Education', icon: AcademicCapIcon },
    { id: 'other', label: 'Other', icon: BanknotesIcon },
];

const essentialsOptions: Option[] = [
    { id: 'rent', label: 'Rent', icon: HomeIcon },
    { id: 'food', label: 'Groceries', icon: ShoppingCartIcon },
    { id: 'utilities', label: 'Utilities', icon: BanknotesIcon },
    { id: 'transport', label: 'Transport', icon: TruckIcon },
    { id: 'health', label: 'Health', icon: HeartIcon },
];


const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as any;

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="w-full bg-bg-tertiary rounded-full h-2.5">
        <motion.div
            className="bg-text-primary h-2.5 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
    </div>
);

const QuestionStep: React.FC<{ title: React.ReactNode; children: React.ReactNode; onNext: () => void; canProceed: boolean; step: number; totalSteps: number }> = ({ title, children, onNext, canProceed, step, totalSteps }) => (
    <div className="w-full max-w-3xl text-center">
        <div className="mb-8 max-w-md mx-auto">
            {title}
            <div className="mt-4">
                 <ProgressBar current={step} total={totalSteps} />
            </div>
        </div>
        {children}
        <VentyButton onClick={onNext} disabled={!canProceed} className="mt-12 !w-auto px-8" label="Next" variant="primary" />
    </div>
);


const LifestyleQuizScreen: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({ spending: '', essentials: [] as string[] });

    const handleNext = () => setStep(s => s + 1);

    const handleSingleSelect = (key: 'spending', id: string) => {
        setAnswers(prev => ({...prev, [key]: id}));
    }

    const toggleMultiSelect = (key: 'essentials', id: string) => {
        setAnswers(prev => {
            const current = prev[key];
            const newSelection = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
            return { ...prev, [key]: newSelection };
        });
    };
    
    const renderStep = () => {
        switch (step) {
            case 1: return (
                <QuestionStep 
                    title={<><p className="font-semibold text-text-secondary">Step 1 of 2</p><p className="text-lg text-text-secondary mt-2">To personalize your insights, tell us — <strong className="text-2xl block text-text-primary mt-1">Which category takes the biggest share of your monthly budget?</strong></p></>}
                    onNext={handleNext} canProceed={answers.spending.length > 0} step={1} totalSteps={2}
                >
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {spendingOptions.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => handleSingleSelect('spending', opt.id)}
                                className={`quiz-selectable-card bg-bg-secondary border-2 shadow-md p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer aspect-square transition-all duration-200 ${answers.spending === opt.id ? 'selected' : 'border-transparent'}`}
                            >
                                <opt.icon className={`h-8 w-8 sm:h-10 sm:h-10 transition-colors ${answers.spending === opt.id ? 'text-text-primary' : 'text-text-secondary'}`} />
                                <p className="font-semibold text-sm mt-2 text-center">{opt.label}</p>
                            </div>
                        ))}
                    </div>
                </QuestionStep>
            );
            case 2: return (
                 <QuestionStep 
                    title={<><p className="font-semibold text-text-secondary">Step 2 of 2</p><p className="text-lg text-text-secondary mt-2">Let’s define your priorities — <strong className="text-2xl block text-text-primary mt-1">Which of these expenses are absolutely non-negotiable each month?</strong></p></>}
                    onNext={() => navigate('/ai-assistant')} canProceed={answers.essentials.length > 0} step={2} totalSteps={2}
                >
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                       {essentialsOptions.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => toggleMultiSelect('essentials', opt.id)}
                                className={`quiz-selectable-card bg-bg-secondary border-2 shadow-md p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer aspect-square transition-all duration-200 ${answers.essentials.includes(opt.id) ? 'selected' : 'border-transparent'}`}
                            >
                                <opt.icon className={`h-8 w-8 sm:h-10 sm:h-10 transition-colors ${answers.essentials.includes(opt.id) ? 'text-text-primary' : 'text-text-secondary'}`} />
                                <p className="font-semibold text-sm mt-2 text-center">{opt.label}</p>
                            </div>
                        ))}
                    </div>
                </QuestionStep>
            );
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col justify-center items-center p-4 lg:p-6 overflow-hidden">
             <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="w-full flex justify-center"
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default LifestyleQuizScreen;
