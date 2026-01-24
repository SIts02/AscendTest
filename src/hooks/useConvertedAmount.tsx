import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserPreferences } from './useUserPreferences';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useCurrencyConverter } from './useCurrencyConverter';

// Cache for converted values to avoid re-fetching
const conversionCache = new Map<string, { value: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to convert a single monetary value from BRL to user's preferred currency.
 * Caches results to minimize API calls.
 */
export function useConvertedAmount(value: number, fromCurrency: string = 'BRL') {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading } = useCurrencyConverter();
  const [converted, setConverted] = useState<number>(value);
  const [loading, setLoading] = useState(false);

  const targetCurrency = preferences.currency || 'BRL';

  useEffect(() => {
    const convert = async () => {
      // If same currency, no conversion needed
      if (targetCurrency === fromCurrency) {
        setConverted(value);
        return;
      }

      // Check cache
      const cacheKey = `${fromCurrency}-${targetCurrency}-${value}`;
      const cached = conversionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setConverted(cached.value);
        return;
      }

      setLoading(true);
      try {
        const result = await convertAmount(value, fromCurrency);
        setConverted(result);
        
        // Cache the result
        conversionCache.set(cacheKey, { value: result, timestamp: Date.now() });
      } catch (error) {
        console.error('Error converting amount:', error);
        setConverted(value); // Fallback to original value
      } finally {
        setLoading(false);
      }
    };

    convert();
  }, [value, fromCurrency, targetCurrency, convertAmount]);

  return { converted, loading: loading || rateLoading };
}

/**
 * Hook to convert multiple monetary values at once.
 * More efficient than calling useConvertedAmount multiple times.
 */
export function useConvertedAmounts(values: number[], fromCurrency: string = 'BRL') {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading } = useCurrencyConverter();
  const [convertedValues, setConvertedValues] = useState<number[]>(values);
  const [loading, setLoading] = useState(false);

  const targetCurrency = preferences.currency || 'BRL';
  
  // Memoize values to prevent unnecessary re-renders
  const valuesKey = useMemo(() => values.join(','), [values]);

  useEffect(() => {
    const convertAll = async () => {
      // If same currency, no conversion needed
      if (targetCurrency === fromCurrency) {
        setConvertedValues(values);
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          values.map(async (value) => {
            // Check cache first
            const cacheKey = `${fromCurrency}-${targetCurrency}-${value}`;
            const cached = conversionCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
              return cached.value;
            }

            const result = await convertAmount(value, fromCurrency);
            conversionCache.set(cacheKey, { value: result, timestamp: Date.now() });
            return result;
          })
        );
        setConvertedValues(results);
      } catch (error) {
        console.error('Error converting amounts:', error);
        setConvertedValues(values); // Fallback
      } finally {
        setLoading(false);
      }
    };

    convertAll();
  }, [valuesKey, fromCurrency, targetCurrency, convertAmount]);

  return { convertedValues, loading: loading || rateLoading };
}

/**
 * Hook that provides a conversion function that uses the user's currency preference.
 * Useful for converting values on-demand.
 */
export function useAsyncCurrencyConverter() {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading, getExchangeRate } = useCurrencyConverter();
  const [cachedRate, setCachedRate] = useState<number | null>(null);
  
  const targetCurrency = preferences.currency || 'BRL';

  // Fetch rate once for sync conversions
  useEffect(() => {
    const fetchRate = async () => {
      if (targetCurrency === 'BRL') {
        setCachedRate(1);
        return;
      }
      try {
        const rate = await getExchangeRate('BRL', targetCurrency);
        setCachedRate(rate);
      } catch (error) {
        console.error('Error fetching rate:', error);
      }
    };
    fetchRate();
  }, [targetCurrency, getExchangeRate]);

  const convert = useCallback(async (value: number, fromCurrency: string = 'BRL'): Promise<number> => {
    if (targetCurrency === fromCurrency) {
      return value;
    }
    
    // Check cache
    const cacheKey = `${fromCurrency}-${targetCurrency}-${value}`;
    const cached = conversionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    const result = await convertAmount(value, fromCurrency);
    conversionCache.set(cacheKey, { value: result, timestamp: Date.now() });
    return result;
  }, [targetCurrency, convertAmount]);

  // Synchronous conversion when rate is available
  const convertSync = useCallback((value: number, fromCurrency: string = 'BRL'): number => {
    if (targetCurrency === fromCurrency || !cachedRate) {
      return value;
    }
    return value * cachedRate;
  }, [targetCurrency, cachedRate]);

  return { 
    convert, 
    convertSync,
    loading: rateLoading, 
    targetCurrency,
    rate: cachedRate 
  };
}

/**
 * Clear the conversion cache. Call this when user changes currency preference.
 */
export function clearConversionCache() {
  conversionCache.clear();
}
