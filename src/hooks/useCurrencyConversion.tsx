import { useCallback, useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface ConversionRates {
  [key: string]: number;
}

interface ConvertedFinancialData {
  amount: number;
  originalCurrency: string;
  targetCurrency: string;
  rate: number;
}

export function useCurrencyConversion() {
  const { preferences } = useUserPreferences();
  const {
    convertCurrency: convertCurrencyValue,
    getExchangeRate,
    getSupportedCurrencies,
    formatCurrency
  } = useCurrencyConverter();

  const exchangeRatesCache = useMemo(() => {
    return new Map<string, { rate: number; timestamp: number }>();
  }, []);

  const convertAmount = useCallback(
    async (
      amount: number,
      fromCurrency: string,
      toCurrency?: string
    ): Promise<number> => {
      try {

        const targetCurrency = toCurrency || preferences.currency;

        if (!amount || amount === 0) {
          return 0;
        }

        if (fromCurrency === targetCurrency) {
          return amount;
        }

        const cacheKey = `${fromCurrency}-${targetCurrency}`;
        const cached = exchangeRatesCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < 3600000) {
          return Number((amount * cached.rate).toFixed(2));
        }

        const rate = await getExchangeRate(fromCurrency, targetCurrency);

        if (rate === null) {
          console.error(`Erro ao obter taxa de câmbio para ${fromCurrency} -> ${targetCurrency}`);
          return amount;
        }

        exchangeRatesCache.set(cacheKey, { rate, timestamp: Date.now() });

        return Number((amount * rate).toFixed(2));
      } catch (error) {
        console.error('Erro ao converter moeda:', error);
        return amount;
      }
    },
    [preferences.currency, getExchangeRate, exchangeRatesCache]
  );

  const convertObject = useCallback(
    async (
      data: Record<string, any>,
      keys: string[],
      fromCurrency: string
    ): Promise<Record<string, any>> => {
      const converted = { ...data };

      for (const key of keys) {
        if (key in converted && typeof converted[key] === 'number') {
          converted[key] = await convertAmount(converted[key], fromCurrency);
        }
      }

      return converted;
    },
    [convertAmount]
  );

  const convertArray = useCallback(
    async (
      data: Record<string, any>[],
      keys: string[],
      fromCurrency: string
    ): Promise<Record<string, any>[]> => {
      return Promise.all(
        data.map(item => convertObject(item, keys, fromCurrency))
      );
    },
    [convertObject]
  );

  const convertFinancialSummary = useCallback(
    async (summary: any, fromCurrency: string) => {
      const keysToConvert = [
        'totalIncome',
        'totalExpense',
        'balance'
      ];

      const converted = await convertObject(summary, keysToConvert, fromCurrency);

      if (converted.monthlyData && Array.isArray(converted.monthlyData)) {
        converted.monthlyData = await convertArray(
          converted.monthlyData,
          ['income', 'expense', 'balance'],
          fromCurrency
        );
      }

      if (converted.spendingByCategory && Array.isArray(converted.spendingByCategory)) {
        converted.spendingByCategory = await convertArray(
          converted.spendingByCategory,
          ['value'],
          fromCurrency
        );
      }

      if (converted.incomeByCategory) {
        const incomeKeys = Object.keys(converted.incomeByCategory);
        for (const key of incomeKeys) {
          converted.incomeByCategory[key] = await convertAmount(
            converted.incomeByCategory[key],
            fromCurrency
          );
        }
      }

      if (converted.expenseByCategory) {
        const expenseKeys = Object.keys(converted.expenseByCategory);
        for (const key of expenseKeys) {
          converted.expenseByCategory[key] = await convertAmount(
            converted.expenseByCategory[key],
            fromCurrency
          );
        }
      }

      return converted;
    },
    [convertObject, convertArray, convertAmount]
  );

  const convertTransactions = useCallback(
    async (transactions: any[], fromCurrency: string) => {
      return convertArray(
        transactions,
        ['amount'],
        fromCurrency
      );
    },
    [convertArray]
  );

  const formatInTargetCurrency = useCallback(
    (amount: number, showSymbol: boolean = true) => {
      return formatCurrency(amount, preferences.currency);
    },
    [preferences.currency, formatCurrency]
  );

  const getCurrentCurrency = useCallback(() => {
    return preferences.currency;
  }, [preferences.currency]);

  return {

    convertAmount,
    convertObject,
    convertArray,
    convertFinancialSummary,
    convertTransactions,

    formatInTargetCurrency,

    getCurrentCurrency,
    getSupportedCurrencies,

    currentCurrency: preferences.currency,
  };
}