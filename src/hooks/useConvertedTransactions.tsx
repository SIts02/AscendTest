import { useCallback, useMemo, useEffect, useState } from 'react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useAuth } from '@/contexts/AuthContext';

export type { Transaction };

export function useConvertedTransactions() {
  const { user } = useAuth();
  const originalTransactions = useTransactions();
  const { preferences } = useUserPreferences();
  const { convertTransactions } = useCurrencyConversion();

  const [convertedTrans, setConvertedTrans] = useState<Transaction[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const convertData = async () => {
      if (!user || originalTransactions.loading) {
        setConvertedTrans(originalTransactions.transactions);
        return;
      }

      if (preferences.currency === 'BRL') {
        setConvertedTrans(originalTransactions.transactions);
        return;
      }

      try {
        setIsConverting(true);

        const originalCurrency = 'BRL';

        const newTransactions = await convertTransactions(
          originalTransactions.transactions,
          originalCurrency
        );

        setConvertedTrans(newTransactions as Transaction[]);
      } catch (err) {
        console.error('Erro ao converter transações:', err);

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
    convertTransactions
  ]);

  return {
    ...originalTransactions,
    transactions: convertedTrans,
    loading: originalTransactions.loading || isConverting,
    isConverting,
    currentCurrency: preferences.currency,
  };
}