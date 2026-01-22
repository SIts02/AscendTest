import { useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RateLimitOptions {
  maxRequests?: number;
  windowMinutes?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Client-side rate limiting using in-memory storage
const rateLimitStore = new Map<string, RateLimitEntry>();

export function useRateLimit() {
  const { user } = useAuth();

  const checkRateLimit = useCallback(async (
    endpoint: string,
    options: RateLimitOptions = {}
  ): Promise<boolean> => {
    if (!user?.id) return true;

    const { maxRequests = 100, windowMinutes = 60 } = options;
    const key = `${user.id}:${endpoint}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // New window or expired
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }, [user?.id]);

  return { checkRateLimit };
}
