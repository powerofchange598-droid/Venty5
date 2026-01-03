
import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useLocalization } from '../hooks/useLocalization';

interface AnimatedCounterProps {
    to: number;
    isCurrency?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ to, isCurrency = false }) => {
    const count = useMotionValue(0);
    const { formatCurrencyEn, formatNumberEn } = useLocalization();

    useEffect(() => {
        const animation = animate(count, to, {
            duration: 1.2,
            ease: "easeOut",
        });
        return animation.stop;
    }, [to, count]);
    
    const displayValue = useTransform(count, latest => {
        if (isCurrency) {
            return formatCurrencyEn(latest);
        }
        return formatNumberEn(Math.round(latest));
    });

    return <motion.span>{displayValue}</motion.span>;
};

export default AnimatedCounter;
