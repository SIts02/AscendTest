import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserPreferences } from './useUserPreferences';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useCurrencyConverter } from './useCurrencyConverter';

const conversionCache = new Map<string, { value: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function useConvertedAmount(value: number, fromCurrency: string = 'BRL') {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading } = useCurrencyConverter();
  const [converted, setConverted] = useState<number>(value);
  const [loading, setLoading] = useState(false);

  const targetCurrency = preferences.currency || 'BRL';

  useEffect(() => {
    const convert = async () => {

      if (targetCurrency === fromCurrency) {
        setConverted(value);
        return;
      }

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

        conversionCache.set(cacheKey, { value: result, timestamp: Date.now() });
      } catch (error) {
        console.error('Error converting amount:', error);
        setConverted(value);
      } finally {
        setLoading(false);
      }
    };

    convert();
  }, [value, fromCurrency, targetCurrency, convertAmount]);

  return { converted, loading: loading || rateLoading };
}

export function useConvertedAmounts(values: number[], fromCurrency: string = 'BRL') {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading } = useCurrencyConverter();
  const [convertedValues, setConvertedValues] = useState<number[]>(values);
  const [loading, setLoading] = useState(false);

  const targetCurrency = preferences.currency || 'BRL';

  const valuesKey = useMemo(() => values.join(','), [values]);

  useEffect(() => {
    const convertAll = async () => {

      if (targetCurrency === fromCurrency) {
        setConvertedValues(values);
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          values.map(async (value) => {

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
        setConvertedValues(values);
      } finally {
        setLoading(false);
      }
    };

    convertAll();
  }, [valuesKey, fromCurrency, targetCurrency, convertAmount]);

  return { convertedValues, loading: loading || rateLoading };
}

export function useAsyncCurrencyConverter() {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading, getExchangeRate } = useCurrencyConverter();
  const [cachedRate, setCachedRate] = useState<number | null>(null);

  const targetCurrency = preferences.currency || 'BRL';

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

    const cacheKey = `${fromCurrency}-${targetCurrency}-${value}`;
    const cached = conversionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    const result = await convertAmount(value, fromCurrency);
    conversionCache.set(cacheKey, { value: result, timestamp: Date.now() });
    return result;
  }, [targetCurrency, convertAmount]);

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

export function clearConversionCache() {
  conversionCache.clear();
}