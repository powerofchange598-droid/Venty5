import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import VentyButton from './VentyButton';
import { XMarkIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } } as any;
const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 15, stiffness: 200 } },
    exit: { opacity: 0, scale: 0.8 },
} as any;

const FormField: React.FC<{ label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }> = 
    ({ label, placeholder, value, onChange, type = 'text' }) => (
    <div>
        <label className="font-medium text-sm">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
            className="w-full mt-1 p-3 bg-ui-background rounded-lg border border-ui-border"
        />
    </div>
);

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentDetails: {
        for: string;
        amount: number;
        description: string;
    };
    onSuccess: (details: any) => void;
    formatCurrency: (val: number) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, paymentDetails, onSuccess, formatCurrency }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    const handleConfirmAndClose = () => {
        onSuccess(paymentDetails);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 modal-backdrop backdrop-blur-sm flex justify-center items-center p-4 z-[100]"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={backdropVariants}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-ui-background rounded-2xl shadow-lg w-full max-w-md"
                        variants={modalVariants}
                        onClick={e => e.stopPropagation()}
                    >
                        {isSuccess ? (
                            <div className="p-8 text-center">
                                <CheckCircleIcon className="h-20 w-20 text-feedback-success mx-auto mb-4" />
                                <h2 className="text-2xl font-bold font-serif">Payment Successful!</h2>
                                <p className="text-ui-secondary mt-2">Your payment of {formatCurrency(paymentDetails.amount)} has been processed.</p>
                                <VentyButton onClick={handleConfirmAndClose} className="w-full mt-6" label="Continue"></VentyButton>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 border-b border-ui-border">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold font-serif">Secure Payment</h2>
                                        <button type="button" onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-ui-secondary">{paymentDetails.description}</p>
                                        <p className="font-semibold text-lg">{formatCurrency(paymentDetails.amount)}</p>
                                    </div>
                                    <hr className="border-ui-border"/>
                                    <FormField label="Card Number" placeholder="**** **** **** ****" value="" onChange={() => {}} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Expiry Date" placeholder="MM / YY" value="" onChange={() => {}} />
                                        <FormField label="CVC" placeholder="123" value="" onChange={() => {}} />
                                    </div>
                                </div>
                                <div className="p-6 border-t border-ui-border">
                                    <VentyButton htmlType="submit" onClick={() => {}} className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(paymentDetails.amount)}`}
                                    </VentyButton>
                                    <p className="text-xs text-ui-secondary mt-4 text-center flex items-center justify-center space-x-1">
                                        <LockClosedIcon className="h-4 w-4" />
                                        <span>Secure payment powered by VentyGate</span>
                                    </p>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
