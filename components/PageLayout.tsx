
import React, { ReactNode, memo } from 'react';
import { motion } from 'framer-motion';
import BackButton from './BackButton';

interface PageLayoutProps {
    title: string;
    children: ReactNode;
    rightAccessory?: ReactNode;
    showHeader?: boolean;
}

const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
} as any;

const PageLayout: React.FC<PageLayoutProps> = ({ title, children, rightAccessory, showHeader = true }) => {
    return (
        <motion.div 
            className="h-full flex flex-col"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
        >
            {showHeader && (
                <header className="flex items-center justify-between p-3 md:p-4 sticky top-0 bg-bg-primary/90 backdrop-blur-md z-20 border-b border-border-primary">
                    <div className="w-10 flex items-center justify-center">
                        <BackButton />
                    </div>
                    <h1 className="text-base md:text-lg font-bold text-center truncate px-2 text-text-primary brand-glow">{title}</h1>
                    <div className="w-10 min-w-[40px] flex justify-center items-center">
                        {rightAccessory}
                    </div>
                </header>
            )}
            <div className="flex-grow">
                {children}
            </div>
        </motion.div>
    );
};

export default memo(PageLayout);
