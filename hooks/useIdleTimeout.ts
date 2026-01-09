import { useEffect, useRef } from 'react';

const useIdleTimeout = (onIdle: () => void, idleTime: number, enabled: boolean = true) => {
    const timeoutId = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) {
            // If the timeout is disabled, clear any existing timer and do nothing.
            if (timeoutId.current) {
                window.clearTimeout(timeoutId.current);
            }
            return;
        }

        // Resets the timer
        const resetTimer = () => {
            if (timeoutId.current) {
                window.clearTimeout(timeoutId.current);
            }
            timeoutId.current = window.setTimeout(onIdle, idleTime);
        };

        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

        // Resets the timer on any user activity
        const handleActivity = () => {
            resetTimer();
        };

        // Set the initial timer
        resetTimer();

        // Add event listeners for user activity
        events.forEach(event => window.addEventListener(event, handleActivity));

        // Cleanup function to remove listeners and clear the timer
        return () => {
            if (timeoutId.current) {
                window.clearTimeout(timeoutId.current);
            }
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [onIdle, idleTime, enabled]); // Rerun effect if these dependencies change
};

export default useIdleTimeout;
