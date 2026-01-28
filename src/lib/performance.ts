import { useEffect, useRef, useState, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle<T>(value: T, limit: number): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
}

export function useIntersectionObserver(
    ref: React.RefObject<Element>,
    options?: IntersectionObserverInit
): boolean {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, {
            threshold: 0.1,
            ...options
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [ref, options]);

    return isIntersecting;
}

export const lazyComponentLoader = {
    preloadComponent: (importFn: () => Promise<any>) => {
        return () => {
            const promise = importFn();

            return promise;
        };
    },

    createLazyComponent: <T extends React.ComponentType<any>>(
        importFn: () => Promise<{ default: T }>
    ) => {
        let promise: Promise<{ default: T }> | null = null;

        return {
            Component: React.lazy(() => {
                if (!promise) {
                    promise = importFn();
                }
                return promise;
            }),
            preload: () => {
                if (!promise) {
                    promise = importFn();
                }
                return promise;
            }
        };
    }
};

export function useEventListener<K extends keyof WindowEventMap>(
    eventName: K,
    handler: (event: WindowEventMap[K]) => void,
    element: Window | HTMLElement | null = window
) {
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!element) return;

        const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
        element.addEventListener(eventName, eventListener);

        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
}

export function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
}

export function usePerformanceMonitor() {
    const [fps, setFps] = useState(60);
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        let animationFrameId: number;

        const measureFPS = () => {
            frameCount.current++;
            const currentTime = performance.now();

            if (currentTime >= lastTime.current + 1000) {
                setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
                frameCount.current = 0;
                lastTime.current = currentTime;
            }

            animationFrameId = requestAnimationFrame(measureFPS);
        };

        animationFrameId = requestAnimationFrame(measureFPS);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return {
        fps,
        isLowPerformance: fps < 30
    };
}

export function useBatchedState<T>(initialValue: T) {
    const [value, setValue] = useState<T>(initialValue);
    const pendingUpdate = useRef<T | null>(null);
    const rafId = useRef<number | null>(null);

    const setBatchedValue = useCallback((newValue: T) => {
        pendingUpdate.current = newValue;

        if (rafId.current === null) {
            rafId.current = requestAnimationFrame(() => {
                if (pendingUpdate.current !== null) {
                    setValue(pendingUpdate.current);
                    pendingUpdate.current = null;
                }
                rafId.current = null;
            });
        }
    }, []);

    useEffect(() => {
        return () => {
            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    return [value, setBatchedValue] as const;
}