import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ToastStateContext = createContext<{ message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ message: '', type: 'info' });
const ToastDispatchContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

    const showToast = useCallback((msg: string, t: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setTimeout(() => {
            setMessage(msg);
            setType(t);
        }, 0);
    }, []);

    return (
        <ToastStateContext.Provider value={{ message, type }}>
            <ToastDispatchContext.Provider value={{ showToast }}>
                {children}
            </ToastDispatchContext.Provider>
        </ToastStateContext.Provider>
    );
};

export const useToastState = () => useContext(ToastStateContext);

export const useToast = (): ToastContextType => {
    const context = useContext(ToastDispatchContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
