import { useState, useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useCurrencyConverter } from './useCurrencyConverter';
import { BudgetCategory } from './useBudget';

export function useConvertedBudget(budgetCategories: BudgetCategory[]) {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading, getExchangeRate } = useCurrencyConverter();
  const [convertedBudget, setConvertedBudget] = useState<BudgetCategory[]>(budgetCategories);
  const [converting, setConverting] = useState(false);
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

  useEffect(() => {
    const convertBudget = async () => {

      if (targetCurrency === 'BRL') {
        setConvertedBudget(budgetCategories);
        return;
      }

      setConverting(true);
      try {
        const converted = await Promise.all(
          budgetCategories.map(async (category) => {
            const [maxAmount, currentAmount] = await Promise.all([
              convertAmount(category.max_amount, 'BRL'),
              convertAmount(category.current_amount, 'BRL'),
            ]);

            return {
              ...category,
              max_amount: maxAmount,
              current_amount: currentAmount,

            };
          })
        );

        setConvertedBudget(converted);
      } catch (error) {
        console.error('Error converting budget:', error);
        setConvertedBudget(budgetCategories);
      } finally {
        setConverting(false);
      }
    };

    convertBudget();
  }, [budgetCategories, targetCurrency, convertAmount]);

  const convertBudgetSync = (categories: BudgetCategory[]): BudgetCategory[] => {
    if (targetCurrency === 'BRL' || !cachedRate) {
      return categories;
    }

    return categories.map((category) => ({
      ...category,
      max_amount: Number((category.max_amount * cachedRate).toFixed(2)),
      current_amount: Number((category.current_amount * cachedRate).toFixed(2)),
    }));
  };

  return {
    convertedBudget,
    convertBudgetSync,
    converting,
    rateLoading,
    currentCurrency: targetCurrency,
    rate: cachedRate
  };
}