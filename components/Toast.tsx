import React, { useState, useEffect } from 'react';
import { useToastState } from '../hooks/useToast';

const Toast = () => {
    const { message, type } = useToastState();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 2700); // Hide after 2.7 seconds ( allowing 300ms for exit animation)

            return () => clearTimeout(timer);
        }
    }, [message]);

    const palette = {
        success: { bg: 'bg-feedback-success/15', text: 'text-feedback-success', border: 'border-feedback-success' },
        error: { bg: 'bg-feedback-error/15', text: 'text-feedback-error', border: 'border-feedback-error' },
        warning: { bg: 'bg-feedback-warning/15', text: 'text-feedback-warning', border: 'border-feedback-warning' },
        info: { bg: 'bg-bg-secondary/80', text: 'text-text-primary', border: 'border-border-primary' },
    }[type];

    return (
        <div
            className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 ${palette.bg} ${palette.text} backdrop-blur-sm rounded-lg shadow-lg border ${palette.border} transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
            {message}
        </div>
    );
};

export default Toast;
