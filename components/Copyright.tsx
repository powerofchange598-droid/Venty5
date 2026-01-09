import React, { memo } from 'react';

const Copyright: React.FC = () => {
    return (
        <footer className="text-center text-xs text-text-secondary p-4">
            © {new Date().getFullYear()} Mostafa Mahmoud. All rights reserved.
        </footer>
    );
};

export default memo(Copyright);
