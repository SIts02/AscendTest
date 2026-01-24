import { useState, useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useCurrencyConverter } from './useCurrencyConverter';
import { clearConversionCache } from './useConvertedAmount';

interface Investment {
  id: string;
  name: string;
  type: string;
  ticker: string | null;
  quantity: number | null;
  average_price: number;
  // Calculated fields from useStockQuotes
  currentPrice: number;
  invested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  change: number;
  changePercent: string;
  // Optional fields that might be present
  purchase_date?: string;
  notes?: string | null;
}

interface Portfolio {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  investments: Investment[];
}

export function useConvertedInvestments() {
  const { preferences } = useUserPreferences();
  const { convertAmount } = useCurrencyConversion();
  const { isLoading: rateLoading, getExchangeRate } = useCurrencyConverter();
  const [converting, setConverting] = useState(false);
  const [cachedRate, setCachedRate] = useState<number | null>(null);
  
  const targetCurrency = preferences.currency || 'BRL';

  // Clear cache when currency changes
  useEffect(() => {
    clearConversionCache();
  }, [targetCurrency]);

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

  const convertPortfolio = async (portfolio: Portfolio | null): Promise<Portfolio | null> => {
    if (!portfolio) return null;
    
    // If same currency, no conversion needed
    if (targetCurrency === 'BRL') {
      return portfolio;
    }

    setConverting(true);
    try {
      // Convert all monetary values in the portfolio
      const [totalInvested, currentValue, totalGainLoss] = await Promise.all([
        convertAmount(portfolio.totalInvested, 'BRL'),
        convertAmount(portfolio.currentValue, 'BRL'),
        convertAmount(portfolio.totalGainLoss, 'BRL'),
      ]);

      // Convert each investment's monetary values
      const convertedInvestments = await Promise.all(
        portfolio.investments.map(async (inv) => {
          const [averagePrice, currentPrice, invested, currentValueInv, gainLoss] = await Promise.all([
            convertAmount(inv.average_price, 'BRL'),
            convertAmount(inv.currentPrice, 'BRL'),
            convertAmount(inv.invested, 'BRL'),
            convertAmount(inv.currentValue, 'BRL'),
            convertAmount(inv.gainLoss, 'BRL'),
          ]);

          return {
            ...inv,
            average_price: averagePrice,
            currentPrice: currentPrice,
            invested: invested,
            currentValue: currentValueInv,
            gainLoss: gainLoss,
            // Change value also needs conversion if it exists
            change: inv.change ? await convertAmount(inv.change, 'BRL') : inv.change,
            // Percentage values don't need conversion
          };
        })
      );

      return {
        ...portfolio,
        totalInvested,
        currentValue,
        totalGainLoss,
        // Percentage doesn't need conversion
        investments: convertedInvestments,
      };
    } catch (error) {
      console.error('Error converting portfolio:', error);
      return portfolio; // Return original on error
    } finally {
      setConverting(false);
    }
  };

  // Synchronous conversion using cached rate (faster but less accurate)
  const convertPortfolioSync = (portfolio: Portfolio | null): Portfolio | null => {
    if (!portfolio) return null;
    
    // If same currency or no rate, return as-is
    if (targetCurrency === 'BRL' || !cachedRate) {
      return portfolio;
    }

    const convertValue = (value: number) => Number((value * cachedRate).toFixed(2));

    return {
      ...portfolio,
      totalInvested: convertValue(portfolio.totalInvested),
      currentValue: convertValue(portfolio.currentValue),
      totalGainLoss: convertValue(portfolio.totalGainLoss),
      investments: portfolio.investments.map((inv) => ({
        ...inv,
        average_price: convertValue(inv.average_price),
        currentPrice: convertValue(inv.currentPrice),
        invested: convertValue(inv.invested),
        currentValue: convertValue(inv.currentValue),
        gainLoss: convertValue(inv.gainLoss),
        change: inv.change ? convertValue(inv.change) : inv.change,
      })),
    };
  };

  return { 
    convertPortfolio, 
    convertPortfolioSync,
    converting, 
    rateLoading,
    currentCurrency: targetCurrency,
    rate: cachedRate
  };
}
