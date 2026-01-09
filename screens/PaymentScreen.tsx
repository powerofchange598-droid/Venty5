
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import PayPalButton from '../components/PayPalButton';
import { useLocalization } from '../hooks/useLocalization';
import {
    CheckCircleIcon, XMarkIcon, UserIcon, BuildingOfficeIcon,
    LockClosedIcon, CreditCardIcon
} from '@heroicons/react/24/solid';

interface PaymentScreenProps {
    user: User;
    onPaymentSuccess: (details: any) => void;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 15, stiffness: 200 } },
    exit: { opacity: 0, scale: 0.8 },
};

const PaymentForm: React.FC<{
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    amount: number;
    formatCurrency: (val: number) => string;
}> = ({ onSubmit, isSubmitting, amount, formatCurrency }) => {
    const [cardholder, setCardholder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        }
        return value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/[^0-9]/gi, '');
        if (v.length >= 3) {
            return `${v.slice(0, 2)} / ${v.slice(2, 4)}`;
        }
        return v;
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6 animate-fadeIn">
            <Card className="neumorphic-card !p-6">
                <h2 className="text-xl font-bold font-serif mb-4 flex items-center space-x-2"><CreditCardIcon className="h-6 w-6" /><span>Card Details</span></h2>
                <div className="space-y-4">
                    <div>
                        <label className="font-medium text-sm">Cardholder Name</label>
                        <input type="text" placeholder="e.g. Jane Doe" value={cardholder} onChange={e => setCardholder(e.target.value)} required className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-bg-tertiary"/>
                    </div>
                     <div>
                        <label className="font-medium text-sm">Card Number</label>
                        <input type="text" placeholder="**** **** **** ****" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} required maxLength={19} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-bg-tertiary"/>
                    </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium text-sm">Expiry Date</label>
                            <input type="text" placeholder="MM / YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} required maxLength={7} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-bg-tertiary"/>
                        </div>
                        <div>
                            <label className="font-medium text-sm">CVC</label>
                            <input type="text" placeholder="***" value={cvc} onChange={e => setCvc(e.target.value.replace(/[^0-9]/gi, ''))} required maxLength={4} className="w-full mt-1 p-3 bg-bg-secondary rounded-lg border border-bg-tertiary"/>
                        </div>
                   </div>
                </div>
            </Card>

            <div>
                <VentyButton htmlType="submit" onClick={() => {}} className="w-full" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
                </VentyButton>
                 <p className="text-xs text-text-secondary mt-4 text-center flex items-center justify-center space-x-1">
                    <LockClosedIcon className="h-4 w-4" />
                    <span>Secure payment powered by VentyGate™</span>
                </p>
            </div>
        </form>
    );
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ user, onPaymentSuccess }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { formatCurrency } = useLocalization();
    const { for: paymentFor, amount, description } = location.state || { for: 'unknown', amount: 0, description: 'Service Payment' };

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('paypal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activePromoPercent, setActivePromoPercent] = useState<number>(0);
    const [showPromo, setShowPromo] = useState<boolean>(false);
    const [promoInput, setPromoInput] = useState<string>('');
    const [promoApplying, setPromoApplying] = useState<boolean>(false);
    const [promoMessage, setPromoMessage] = useState<string>('');
    const [promoError, setPromoError] = useState<boolean>(false);
  const discountedAmount = useMemo(() => {
    const pct = Math.max(0, Math.min(100, activePromoPercent));
    const disc = amount * (pct / 100);
    const final = Math.max(0, Number((amount - disc).toFixed(2)));
    return final;
  }, [amount, activePromoPercent]);

    // --- Card Handlers ---
    const handleCardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setShowConfirmation(true);
        }, 1500);
    };

    // --- PayPal Handlers ---
    const handlePayPalSuccess = (details: any) => {
        console.log("PayPal Success Details:", details);
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        setShowConfirmation(false);
        onPaymentSuccess({ ...location.state, amount: amount, method: paymentMethod });
    };
    
    const safeUserId = (() => {
        const fromState = (location.state as any)?.userId;
        const fromUser = (user as any)?.id;
        const key = 'venty_guest_id';
        let stored = '';
        try { stored = localStorage.getItem(key) || ''; } catch {}
        if (fromState) return String(fromState);
        if (fromUser) return String(fromUser);
        if (stored) return stored;
        const newId = 'guest_' + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem(key, newId); } catch {}
        return newId;
    })();

    useEffect(() => {
        if (!location.state) {
            navigate('/dashboard');
            return;
        }
    }, [location.state, navigate]);

    const [backendReady, setBackendReady] = useState<boolean | null>(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetch(`/api/health`);
                const data = await resp.json().catch(() => ({}));
                const ready = resp.ok && !!data?.ok;
                if (!cancelled) setBackendReady(ready);
                if (ready) {
                    try {
                        const activeResp = await fetch(`/api/promo-codes/active/${safeUserId}`);
                        const activeData = await activeResp.json().catch(() => ({}));
                        if (activeResp.ok && activeData.ok) {
                            setActivePromoPercent(Number(activeData.bestPercent || 0));
                        }
                    } catch {}
                }
            } catch {
                if (!cancelled) setBackendReady(false);
            }
        })();
        return () => { cancelled = true; };
    }, [safeUserId]);

    const applyPromo = async () => {
        setPromoApplying(true);
        setPromoMessage('');
        setPromoError(false);
        try {
            if (!backendReady) {
                setPromoMessage('Promo service is offline.');
                setPromoError(true);
                return;
            }
            const resp = await fetch(`/api/promo-codes/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoInput.trim(), userId: safeUserId })
            });
            const data = await resp.json();
            if (resp.ok && data.ok) {
                const pct = Number(data.discountPercent || 0);
                setActivePromoPercent(pct);
              setPromoMessage(`Promo code applied: ${pct}% off${data.expiresAt ? ` • Expires ${new Date(data.expiresAt).toLocaleDateString()}` : ''}`);
              setPromoError(false);
            } else {
              setPromoMessage('Could not validate promo code.');
              setPromoError(true);
            }
        } catch {
            setPromoMessage('Could not validate promo code.');
            setPromoError(true);
        } finally {
            setPromoApplying(false);
        }
    };

    // --- Dynamic Content based on paymentFor ---
    const { pageTitle, subTitle, confirmationTitle, confirmationText } = useMemo(() => {
        switch (paymentFor) {
            case 'premium_subscription':
                return {
                    pageTitle: "Upgrade to Premium",
                    subTitle: `Unlock your Goals and track your financial growth.`,
                    confirmationTitle: "You're Premium now!",
                    confirmationText: "Your account has been upgraded. Goals and advanced insights are now unlocked."
                };
            case 'verified_badge':
                return {
                    pageTitle: "Venty User Verification",
                    subTitle: `Verify your identity and unlock trust benefits.`,
                    confirmationTitle: "Verified!",
                    confirmationText: "Your account is now trusted and marked with a blue verification badge visible to all users."
                };
            case 'ad_subscription':
                return {
                    pageTitle: "Marketing Subscription",
                    subTitle: description,
                    confirmationTitle: "Campaign Active!",
                    confirmationText: "Your marketing plan is now active. You can start creating campaigns immediately."
                };
            default:
                return {
                    pageTitle: "Secure Checkout",
                    subTitle: description,
                    confirmationTitle: "Payment Successful!",
                    confirmationText: `Your payment of ${formatCurrency(discountedAmount || amount)} has been processed.`
                };
        }
    }, [paymentFor, amount, description, formatCurrency, discountedAmount]);


    return (
        <PageLayout title={pageTitle}>
            <div className="max-w-md mx-auto p-4 lg:p-6 space-y-6">
                <div className="text-center">
                    <p className="text-lg text-text-secondary">{subTitle}</p>
                    <h1 className="text-3xl font-bold text-brand-primary mt-2">{formatCurrency(discountedAmount || amount)}</h1>
                </div>

                {/* Promo Code (shown only within payment flow) */}
                <div className="rounded-xl bg-bg-primary p-3 shadow-sm">
                    {!showPromo ? (
                        <button onClick={() => setShowPromo(true)} className="text-sm font-semibold text-brand-primary">
                            Have a promo code?
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input type="text" value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="Enter promo code" className="w-full p-2 bg-bg-secondary rounded-lg border border-bg-tertiary" />
                                <VentyButton onClick={applyPromo} className="!w-auto !px-4 !py-2" label={promoApplying ? 'Applying…' : 'Apply'} disabled={promoApplying} />
                            </div>
                            {promoMessage && (
                                <p className={`text-sm ${promoError ? 'text-feedback-error' : 'text-feedback-success'}`}>{promoMessage}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Method Selector */}
                <div className="bg-bg-tertiary p-1 rounded-xl flex gap-1">
                    <button 
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <CreditCardIcon className="h-4 w-4" /> Credit Card
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-tertiary">Soon</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('paypal')}
                        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${paymentMethod === 'paypal' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337l.756-4.789h3.292c3.271 0 5.864-1.317 6.643-4.887.278-1.272.179-2.28-.423-3.07-.747-.98-2.126-1.53-4.227-1.53H6.18L4.01 21.337h3.066zM8.867 8.94h3.69c1.78 0 2.76.929 2.49 2.164-.22 1.01-.97 1.63-2.28 1.63H10.15l-.893 5.657H8.36L9.61 9.389a.63.63 0 01-.743-.449z"/></svg>
                        PayPal
                    </button>
                </div>

                {paymentMethod === 'card' ? (
                    <div className="py-4 animate-fadeIn">
                        <Card className="!p-6 mb-4 bg-brand-primary/5 border border-brand-primary/20">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <CreditCardIcon className="h-6 w-6 text-brand-primary" />
                                <h3 className="font-bold text-lg text-brand-primary">Credit Card</h3>
                            </div>
                            <p className="text-sm text-text-secondary mb-4 text-center">This payment method is coming soon. Please use PayPal for now.</p>
                            <VentyButton className="w-full" variant="secondary" disabled label="Coming Soon" onClick={() => {}}></VentyButton>
                        </Card>
                    </div>
                ) : paymentMethod === 'paypal' ? (
                    <div className="py-4 animate-fadeIn">
                        <Card className="!p-6 mb-4 bg-[#003087]/5">
                            <h3 className="font-bold text-lg mb-2 text-[#003087] dark:text-blue-300">Pay with PayPal</h3>
                            {activePromoPercent > 0 && (
                                <div className="text-sm mb-2">
                                    <p className="text-feedback-success">Promo applied: -{activePromoPercent}%</p>
                                    <p className="font-semibold">Total: {formatCurrency(discountedAmount)}</p>
                                </div>
                            )}
                            <p className="text-sm text-text-secondary mb-4">You will be securely redirected to PayPal to complete your purchase. Your financial information is not shared with Venty.</p>
                            {backendReady === false ? (
                                <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-3 rounded-lg mb-4 text-sm font-medium text-center">
                                    Payments are temporarily disabled. Please try again later.
                                </div>
                            ) : discountedAmount <= 0 ? (
                                <VentyButton className="w-full" variant="primary" label="Complete Free Purchase" onClick={() => setShowConfirmation(true)} />
                            ) : (
                                <PayPalButton 
                                    amount={discountedAmount}
                                    description={description}
                                    onSuccess={handlePayPalSuccess}
                                />
                            )}
                            {errorMsg && <p className="text-sm text-feedback-error mt-3">{errorMsg}</p>}
                        </Card>
                    </div>
                ) : null}
            </div>

            <AnimatePresence>
                {showConfirmation && (
                    <motion.div className="fixed inset-0 modal-backdrop backdrop-blur-sm flex justify-center items-center p-4 z-[100]" initial="hidden" animate="visible" exit="exit" variants={backdropVariants}>
                        <motion.div className="bg-bg-secondary rounded-2xl shadow-lg w-full max-w-sm p-8 text-center" variants={modalVariants as any}>
                            <CheckCircleIcon className="h-20 w-20 text-feedback-success mx-auto mb-4" />
                            <h2 className="text-2xl font-bold font-serif">{confirmationTitle}</h2>
                            <p className="text-text-secondary mt-2">{confirmationText}</p>
                            <VentyButton onClick={handleConfirm} className="w-full mt-6" label="Continue" variant="primary"></VentyButton>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageLayout>
    );
};

export default PaymentScreen;
