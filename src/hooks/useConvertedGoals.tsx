import { useState, useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useCurrencyConverter } from './useCurrencyConverter';
import { Goal } from './useGoals';

export function useConvertedGoals(goals: Goal[]) {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading, getExchangeRate } = useCurrencyConverter();
  const [convertedGoals, setConvertedGoals] = useState<Goal[]>(goals);
  const [converting, setConverting] = useState(false);
  const [cachedRate, setCachedRate] = useState<number | null>(null);
  
  const targetCurrency = preferences.currency || 'BRL';

  // Fetch rate for sync conversions
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
    const convertGoals = async () => {
      // If same currency, no conversion needed
      if (targetCurrency === 'BRL') {
        setConvertedGoals(goals);
        return;
      }

      setConverting(true);
      try {
        const converted = await Promise.all(
          goals.map(async (goal) => {
            const [target, current] = await Promise.all([
              convertAmount(goal.target, 'BRL'),
              convertAmount(goal.current, 'BRL'),
            ]);

            return {
              ...goal,
              target,
              current,
            };
          })
        );

        setConvertedGoals(converted);
      } catch (error) {
        console.error('Error converting goals:', error);
        setConvertedGoals(goals); // Fallback
      } finally {
        setConverting(false);
      }
    };

    convertGoals();
  }, [goals, targetCurrency, convertAmount]);

  // Synchronous conversion using cached rate
  const convertGoalsSync = (goalsList: Goal[]): Goal[] => {
    if (targetCurrency === 'BRL' || !cachedRate) {
      return goalsList;
    }

    return goalsList.map((goal) => ({
      ...goal,
      target: Number((goal.target * cachedRate).toFixed(2)),
      current: Number((goal.current * cachedRate).toFixed(2)),
    }));
  };

  return { 
    convertedGoals, 
    convertGoalsSync,
    converting, 
    rateLoading,
    currentCurrency: targetCurrency,
    rate: cachedRate
  };
}
