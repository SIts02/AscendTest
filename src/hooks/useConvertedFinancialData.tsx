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
  const { convertFinancialSummary, convertTransactions, currentCurrency } = useCurrencyConversion();

  // Armazenar moeda usada para os dados atuais
  const [convertedSummary, setConvertedSummary] = useState(summary);
  const [convertedTransactions, setConvertedTransactions] = useState(transactions);
  const [isConverting, setIsConverting] = useState(false);
  const [lastConvertedCurrency, setLastConvertedCurrency] = useState(currentCurrency);

  // Detectar mudança de moeda
  const currencyChanged = useMemo(
    () => currentCurrency !== lastConvertedCurrency,
    [currentCurrency, lastConvertedCurrency]
  );

  /**
   * Converter dados quando a moeda muda
   */
  useEffect(() => {
    const convertData = async () => {
      if (!user || loading || !transactions.length) {
        setConvertedSummary(summary);
        setConvertedTransactions(transactions);
        return;
      }

      // Se a moeda não mudou, usar dados como estão (já em BRL no banco)
      if (!currencyChanged && lastConvertedCurrency === preferences.currency) {
        setConvertedSummary(summary);
        setConvertedTransactions(transactions);
        return;
      }

      try {
        setIsConverting(true);
        
        // Os dados no banco estão em BRL por padrão, então converter de BRL
        const originalCurrency = 'BRL'; // Moeda padrão no banco

        // Converter summary
        const newSummary = await convertFinancialSummary(summary, originalCurrency);
        setConvertedSummary(newSummary);

        // Converter transações
        const newTransactions = await convertTransactions(
          transactions,
          originalCurrency
        );
        setConvertedTransactions(newTransactions);

        // Atualizar moeda atual
        setLastConvertedCurrency(preferences.currency);
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
    currencyChanged,
    convertFinancialSummary,
    convertTransactions,
    lastConvertedCurrency
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
