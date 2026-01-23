import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook que fornece dados financeiros convertidos para a moeda do usuário
 * Substitui o useFinancialData com suporte a conversão automática
 */
export function useConvertedFinancialData() {
  const { user } = useAuth();
  const { transactions, summary, loading, error } = useFinancialData();
  const { preferences } = useUserPreferences();
  const { convertFinancialSummary, convertTransactions } = useCurrencyConversion();

  // Armazenar dados convertidos
  const [convertedSummary, setConvertedSummary] = useState(summary);
  const [convertedTransactions, setConvertedTransactions] = useState(transactions);
  const [isConverting, setIsConverting] = useState(false);

  /**
   * Converter dados quando a moeda muda ou dados mudam
   */
  useEffect(() => {
    const convertData = async () => {
      if (!user || loading) {
        setConvertedSummary(summary);
        setConvertedTransactions(transactions);
        return;
      }

      // Se a moeda é BRL (padrão), não precisa converter
      if (preferences.currency === 'BRL') {
        setConvertedSummary(summary);
        setConvertedTransactions(transactions);
        return;
      }

      try {
        setIsConverting(true);
        
        console.log(`Converting from BRL to ${preferences.currency}`);
        
        // Os dados no banco estão em BRL por padrão, então converter de BRL
        const originalCurrency = 'BRL';

        // Converter summary
        const newSummary = await convertFinancialSummary(summary, originalCurrency);
        setConvertedSummary(newSummary as any);

        // Converter transações
        const newTransactions = await convertTransactions(
          transactions,
          originalCurrency
        );
        setConvertedTransactions(newTransactions as any);
        
        console.log(`Conversion to ${preferences.currency} completed`);
      } catch (err) {
        console.error('Erro ao converter dados financeiros:', err);
        // Fallback: usar dados originais
        setConvertedSummary(summary);
        setConvertedTransactions(transactions);
      } finally {
        setIsConverting(false);
      }
    };

    convertData();
  }, [
    transactions,
    summary,
    preferences.currency,
    user,
    loading,
    convertFinancialSummary,
    convertTransactions
  ]);

  return {
    transactions: convertedTransactions,
    summary: convertedSummary,
    loading: loading || isConverting,
    error,
    isConverting,
    currentCurrency: preferences.currency,
  };
}
