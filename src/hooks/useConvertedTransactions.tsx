import { useCallback, useMemo, useEffect, useState } from 'react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useAuth } from '@/contexts/AuthContext';

export type { Transaction };

/**
 * Hook que fornece transações convertidas para a moeda do usuário
 * Substitui o useTransactions com suporte a conversão automática
 */
export function useConvertedTransactions() {
  const { user } = useAuth();
  const originalTransactions = useTransactions();
  const { preferences } = useUserPreferences();
  const { convertTransactions, currentCurrency } = useCurrencyConversion();

  const [convertedTrans, setConvertedTrans] = useState<Transaction[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [lastConvertedCurrency, setLastConvertedCurrency] = useState(currentCurrency);

  // Detectar mudança de moeda
  const currencyChanged = useMemo(
    () => currentCurrency !== lastConvertedCurrency,
    [currentCurrency, lastConvertedCurrency]
  );

  /**
   * Converter transações quando a moeda muda
   */
  useEffect(() => {
    const convertData = async () => {
      if (!user || originalTransactions.loading || !originalTransactions.transactions.length) {
        setConvertedTrans(originalTransactions.transactions);
        return;
      }

      // Se a moeda não mudou, usar dados como estão
      if (!currencyChanged && lastConvertedCurrency === preferences.currency) {
        setConvertedTrans(originalTransactions.transactions);
        return;
      }

      try {
        setIsConverting(true);

        // Os dados no banco estão em BRL por padrão
        const originalCurrency = 'BRL';

        // Converter transações
        const newTransactions = await convertTransactions(
          originalTransactions.transactions,
          originalCurrency
        );
        
        setConvertedTrans(newTransactions as Transaction[]);
        setLastConvertedCurrency(preferences.currency);
      } catch (err) {
        console.error('Erro ao converter transações:', err);
        // Fallback: usar dados originais
        setConvertedTrans(originalTransactions.transactions);
      } finally {
        setIsConverting(false);
      }
    };

    convertData();
  }, [
    originalTransactions.transactions,
    originalTransactions.loading,
    preferences.currency,
    user,
    currencyChanged,
    convertTransactions,
    lastConvertedCurrency
  ]);

  return {
    ...originalTransactions,
    transactions: convertedTrans,
    loading: originalTransactions.loading || isConverting,
    isConverting,
    currentCurrency: preferences.currency,
  };
}
