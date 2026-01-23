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

/**
 * Hook que gerencia a conversão de valores financeiros entre moedas
 * Usado para converter todos os dados financeiros do usuário (saldos, gráficos, investimentos)
 * quando ele muda a moeda padrão nas configurações
 */
export function useCurrencyConversion() {
  const { preferences } = useUserPreferences();
  const { 
    convertCurrency: convertCurrencyValue,
    getExchangeRate,
    getSupportedCurrencies,
    formatCurrency
  } = useCurrencyConverter();

  // Armazenar taxas de câmbio em cache para performance
  const exchangeRatesCache = useMemo(() => {
    return new Map<string, { rate: number; timestamp: number }>();
  }, []);

  /**
   * Converte um valor de uma moeda para outra
   * @param amount - Valor a converter
   * @param fromCurrency - Moeda de origem
   * @param toCurrency - Moeda de destino (padrão: preferência do usuário)
   * @returns Valor convertido
   */
  const convertAmount = useCallback(
    async (
      amount: number,
      fromCurrency: string,
      toCurrency?: string
    ): Promise<number> => {
      try {
        // Usar moeda de destino padrão das preferências
        const targetCurrency = toCurrency || preferences.currency;

        if (!amount || amount === 0) {
          return 0;
        }

        if (fromCurrency === targetCurrency) {
          return amount;
        }

        // Verificar cache
        const cacheKey = `${fromCurrency}-${targetCurrency}`;
        const cached = exchangeRatesCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < 3600000) { // Cache de 1 hora
          return Number((amount * cached.rate).toFixed(2));
        }

        // Buscar taxa se não estiver em cache
        const rate = await getExchangeRate(fromCurrency, targetCurrency);
        
        if (rate === null) {
          console.error(`Erro ao obter taxa de câmbio para ${fromCurrency} -> ${targetCurrency}`);
          return amount; // Retornar valor original em caso de erro
        }

        // Atualizar cache
        exchangeRatesCache.set(cacheKey, { rate, timestamp: Date.now() });

        return Number((amount * rate).toFixed(2));
      } catch (error) {
        console.error('Erro ao converter moeda:', error);
        return amount; // Retornar valor original em caso de erro
      }
    },
    [preferences.currency, getExchangeRate, exchangeRatesCache]
  );

  /**
   * Converte um objeto com múltiplos valores
   * @param data - Objeto com valores a converter
   * @param keys - Chaves do objeto que contêm valores monetários
   * @param fromCurrency - Moeda de origem
   * @returns Novo objeto com valores convertidos
   */
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

  /**
   * Converte um array de objetos
   * @param data - Array de objetos com valores a converter
   * @param keys - Chaves que contêm valores monetários
   * @param fromCurrency - Moeda de origem
   * @returns Array com valores convertidos
   */
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

  /**
   * Converte dados financeiros completos
   * @param summary - Resumo financeiro com totais
   * @param fromCurrency - Moeda de origem
   * @returns Resumo com valores convertidos
   */
  const convertFinancialSummary = useCallback(
    async (summary: any, fromCurrency: string) => {
      const keysToConvert = [
        'totalIncome',
        'totalExpense',
        'balance'
      ];

      const converted = await convertObject(summary, keysToConvert, fromCurrency);

      // Converter dados mensais
      if (converted.monthlyData && Array.isArray(converted.monthlyData)) {
        converted.monthlyData = await convertArray(
          converted.monthlyData,
          ['income', 'expense', 'balance'],
          fromCurrency
        );
      }

      // Converter dados por categoria (income e expense)
      if (converted.spendingByCategory && Array.isArray(converted.spendingByCategory)) {
        converted.spendingByCategory = await convertArray(
          converted.spendingByCategory,
          ['value'],
          fromCurrency
        );
      }

      // Converter incomeByCategory e expenseByCategory
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

  /**
   * Converte um array de transações
   * @param transactions - Array de transações
   * @param fromCurrency - Moeda de origem
   * @returns Transações com valores convertidos
   */
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

  /**
   * Formata um valor na moeda alvo do usuário
   * @param amount - Valor a formatar
   * @param showSymbol - Mostrar símbolo da moeda
   * @returns Valor formatado
   */
  const formatInTargetCurrency = useCallback(
    (amount: number, showSymbol: boolean = true) => {
      return formatCurrency(amount, preferences.currency);
    },
    [preferences.currency, formatCurrency]
  );

  /**
   * Obtém a moeda atual do usuário
   */
  const getCurrentCurrency = useCallback(() => {
    return preferences.currency;
  }, [preferences.currency]);

  return {
    // Conversão
    convertAmount,
    convertObject,
    convertArray,
    convertFinancialSummary,
    convertTransactions,
    
    // Formatação
    formatInTargetCurrency,
    
    // Informações
    getCurrentCurrency,
    getSupportedCurrencies,
    
    // Estado
    currentCurrency: preferences.currency,
  };
}
