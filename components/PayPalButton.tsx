import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useTheme } from '../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';

interface PayPalButtonProps {
    amount: number;
    description?: string;
    onSuccess: (details: any) => void;
    onError?: (error: any) => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, description, onSuccess, onError }) => {
    const { theme } = useTheme();
    const [error, setError] = useState<string | null>(null);
    const [disabledMessage, setDisabledMessage] = useState<string | null>(null);

    const initialOptions = {
        clientId: (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || "",
        currency: "USD",
        intent: "capture",
    };

    useEffect(() => {
        if (!initialOptions.clientId) {
            setDisabledMessage('PayPal is not configured (missing client ID). Please try another payment method.');
            return;
        }
        (async () => {
            try {
                const r = await fetch('/api/health');
                const d = await r.json().catch(() => ({}));
                if (!d?.hasCredentials) {
                    setDisabledMessage('PayPal server credentials are missing. Please try another payment method.');
                }
            } catch {
                setDisabledMessage('Payment backend is offline. Please try again later.');
            }
        })();
    }, []);

    if (disabledMessage) {
        return (
            <div className="w-full">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-3 rounded-lg mb-4 text-sm font-medium text-center">
                    {disabledMessage}
                </div>
            </div>
        );
    }

    const createOrder = async () => {
        try {
            const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, description })
            });
            
            const orderData = await response.json();
            
            if (orderData.id) {
                return orderData.id;
            } else {
                const errorDetail = orderData?.details?.[0];
                const errorMessage = errorDetail
                    ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData);
                throw new Error(errorMessage);
            }
        } catch (err: any) {
            console.error('Create Order Error:', err);
            setError(`Could not initiate payment: ${err.message}`);
            if (onError) onError(err);
            throw err;
        }
    };

    const onApprove = async (data: any, actions: any) => {
        try {
            const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID })
            });

            const transaction = await response.json();

            if (transaction.ok) {
                onSuccess(transaction.details);
            } else {
                const errorDetail = transaction?.details?.[0];
                const errorMessage = errorDetail
                    ? `${errorDetail.issue} ${errorDetail.description} (${transaction.debug_id})`
                    : JSON.stringify(transaction);
                throw new Error(errorMessage);
            }
        } catch (err: any) {
            console.error('Capture Error:', err);
            setError(`Payment failed: ${err.message}`);
            if (onError) onError(err);
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-medium text-center"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-0">
                <PayPalScriptProvider options={initialOptions}>
                    <PayPalButtons
                        style={{
                            layout: "vertical",
                            color: theme === 'dark' ? 'gold' : 'blue',
                            shape: "rect",
                            label: "pay"
                        }}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={(err: any) => {
                            console.error('PayPal Button Error:', err);
                            setError('An unexpected error occurred with PayPal.');
                            if (onError) onError(err);
                        }}
                    />
                </PayPalScriptProvider>
            </div>
        </div>
    );
};

export default PayPalButton;
