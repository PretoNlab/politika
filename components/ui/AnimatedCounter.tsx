import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, duration = 2000, prefix = '', suffix = '', className = '' }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                setHasAnimated(true);
                let startTimestamp: number | null = null;

                const step = (timestamp: number) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    // easeOutQuart
                    const easeOut = 1 - Math.pow(1 - progress, 4);

                    setCount(Math.floor(easeOut * end));

                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    } else {
                        setCount(end);
                    }
                };

                window.requestAnimationFrame(step);
            }
        }, { threshold: 0.1 });

        const currentRef = countRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [end, duration, hasAnimated]);

    return (
        <div ref={countRef} className={className}>
            {prefix}{count.toLocaleString('pt-BR')}{suffix}
        </div>
    );
};

export default AnimatedCounter;
