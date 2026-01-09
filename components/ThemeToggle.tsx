
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, BoltIcon } from '@heroicons/react/24/solid';
import { useTheme, Theme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        const themes: Theme[] = ['light', 'dark-gold', 'dark-red'];
        const currentIndex = themes.indexOf(theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        setTheme(nextTheme);
    };

    const iconVariants = {
        hidden: { y: -10, opacity: 0, rotate: -45 },
        visible: { y: 0, opacity: 1, rotate: 0 },
        exit: { y: 10, opacity: 0, rotate: 45 },
    };

    const renderIcon = () => {
        if (theme === 'light') return <SunIcon className="h-5 w-5 text-text-secondary" />;
        if (theme === 'dark-gold') return <MoonIcon className="h-5 w-5 text-text-secondary" />;
        return <BoltIcon className="h-5 w-5 text-text-secondary" />;
    };

    return (
        <button
            onClick={cycleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-tertiary"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={iconVariants}
                    transition={{ duration: 0.2 }}
                >
                    {renderIcon()}
                </motion.div>
            </AnimatePresence>
        </button>
    );
};

export default ThemeToggle;
