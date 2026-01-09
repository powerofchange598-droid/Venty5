
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_CURRENCY } from '../data/currencyData';

interface LocalizationContextType {
    currency: string;
    setCurrency: (curr: string) => void;
    formatCurrency: (value: number) => string;
    formatCurrencyEn: (value: number) => string;
    formatNumberEn: (value: number) => string;
    language: string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();

    const [currency, setCurrencyState] = useState<string>(() => {
        const saved = localStorage.getItem('ventyCurrency');
        if (saved) return saved;
        const savedCountry = localStorage.getItem('ventyCountry');
        if (savedCountry && COUNTRY_CURRENCY[savedCountry]) return COUNTRY_CURRENCY[savedCountry].code;
        return 'USD';
    });

    useEffect(() => {
        localStorage.setItem('ventyCurrency', currency);
    }, [currency]);

    useEffect(() => {}, []);

    const setCurrency = (curr: string) => {
        setCurrencyState(curr);
    };

    const formatCurrency = useCallback((value: number) => {
        try {
            return new Intl.NumberFormat('en', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        } catch (error) {
            return `${Math.round(value).toLocaleString('en-US')} ${currency}`;
        }
    }, [currency]);

    const formatCurrencyEn = useCallback((value: number) => {
        try {
            return new Intl.NumberFormat('en', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        } catch {
            return `${Math.round(value).toLocaleString('en-US')} ${currency}`;
        }
    }, [currency]);

    const formatNumberEn = useCallback((value: number) => {
        try {
            return new Intl.NumberFormat('en', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        } catch {
            return Math.round(value).toString();
        }
    }, []);

    const value = {
        currency,
        setCurrency,
        formatCurrency,
        formatCurrencyEn,
        formatNumberEn,
        language: i18n.language,
    };

    return (
        <LocalizationContext.Provider value={value}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
