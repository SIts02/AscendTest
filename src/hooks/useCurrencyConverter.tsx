import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ExchangeRates {
  [key: string]: number;
}

interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: number;
}

const SUPPORTED_CURRENCIES = {
  BRL: 'Real Brasileiro',
  USD: 'Dólar Americano',
  EUR: 'Euro',
  GBP: 'Libra Esterlina',
  JPY: 'Iene Japonês',
  AUD: 'Dólar Australiano',
  CAD: 'Dólar Canadense',
  CHF: 'Franco Suíço',
  CNY: 'Yuan Chinês',
  INR: 'Rúpia Indiana',
};

const MOCK_RATES: ExchangeRates = {
  USD: 1,
  BRL: 5.15,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  AUD: 1.52,
  CAD: 1.35,
  CHF: 0.89,
  CNY: 7.24,
  INR: 83.12,
};

const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 100;

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export function useCurrencyConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastConversion, setLastConversion] = useState<ConversionResult | null>(null);

  const checkRateLimit = useCallback((userId: string): boolean => {
    const now = Date.now();
    const userLimit = rateLimitStore[userId];

    if (!userLimit) {
      rateLimitStore[userId] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
      return true;
    }

    if (now > userLimit.resetTime) {
      rateLimitStore[userId] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
      return true;
    }

    if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    userLimit.count++;
    return true;
  }, []);

  const validateCurrency = useCallback((currency: string): boolean => {
    return currency in SUPPORTED_CURRENCIES;
  }, []);

  const validateAmount = useCallback((amount: number): boolean => {
    return amount > 0 && amount < 1000000 && !isNaN(amount);
  }, []);

  const getExchangeRate = useCallback(
    async (from: string, to: string): Promise<number | null> => {
      try {

        if (!validateCurrency(from) || !validateCurrency(to)) {
          throw new Error('Moeda inválida');
        }

        if (from === to) {
          return 1;
        }

        const fromRate = MOCK_RATES[from] || 1;
        const toRate = MOCK_RATES[to] || 1;
        const rate = toRate / fromRate;

        return Number(rate.toFixed(4));
      } catch (error: any) {
        console.error('Error fetching exchange rate:', error);
        throw error;
      }
    },
    [validateCurrency]
  );

  const convertCurrency = useCallback(
    async (
      from: string,
      to: string,
      amount: number,
      userId?: string
    ): Promise<ConversionResult | null> => {
      try {

        if (userId && !checkRateLimit(userId)) {
          throw new Error('Muitas requisições. Tente novamente em alguns momentos.');
        }

        if (!validateCurrency(from) || !validateCurrency(to)) {
          throw new Error('Moeda inválida. Moedas suportadas: ' + Object.keys(SUPPORTED_CURRENCIES).join(', '));
        }

        if (!validateAmount(amount)) {
          throw new Error('Valor deve estar entre 0 e 1.000.000');
        }

        setIsLoading(true);

        const rate = await getExchangeRate(from, to);
        if (rate === null) {
          throw new Error('Erro ao obter taxa de câmbio');
        }

        const convertedAmount = Number((amount * rate).toFixed(2));

        const result: ConversionResult = {
          from,
          to,
          amount,
          convertedAmount,
          rate,
          timestamp: Date.now(),
        };

        setLastConversion(result);
        return result;
      } catch (error: any) {
        console.error('Error converting currency:', error);
        toast.error(error.message || 'Erro ao converter moeda');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [validateCurrency, validateAmount, getExchangeRate, checkRateLimit]
  );

  const getSupportedCurrencies = useCallback(() => {
    return SUPPORTED_CURRENCIES;
  }, []);

  const getCurrencySymbol = useCallback((currency: string): string => {
    const symbols: { [key: string]: string } = {
      BRL: 'R$',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'CHF',
      CNY: '¥',
      INR: '₹',
    };
    return symbols[currency] || currency;
  }, []);

  const formatCurrency = useCallback(
    (value: number, currency: string): string => {
      const symbol = getCurrencySymbol(currency);
      return `${symbol} ${value.toFixed(2).replace('.', ',')}`;
    },
    [getCurrencySymbol]
  );

  return {
    convertCurrency,
    getExchangeRate,
    getSupportedCurrencies,
    getCurrencySymbol,
    formatCurrency,
    lastConversion,
    isLoading,
  };
}