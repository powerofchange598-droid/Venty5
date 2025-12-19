
import React, { ReactNode, memo } from 'react';

interface VentyButtonProps {
    children?: ReactNode;
    label?: ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning' | 'info';
    className?: string;
    disabled?: boolean;
    htmlType?: 'button' | 'submit' | 'reset';
    title?: string;
}

const VentyButton: React.FC<VentyButtonProps> = ({
    children,
    label,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false,
    htmlType = 'button',
    title,
}) => {
    // Maps react props to the new global CSS classes defined in index.html
    const baseClasses = 'btn';
    const variantClasses = `btn-${variant}`;
    const glowClass = variant === 'primary' ? 'brand-glow' : '';
    
    // Combine props.className with our base styles. 
    // Note: External classNames can override width, margin, etc., but color/shadow should rely on the variant class.
    
    return (
        <button
            type={htmlType}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseClasses} ${variantClasses} ${glowClass} ${className}`}
        >
            {/* If both children and label are present, render children (more flexible). If just label, render label. */}
            {children ? children : label}
        </button>
    );
};

export default memo(VentyButton);
