import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  open: number;
  high: number;
  low: number;
}

interface StockQuoteCache {
  [symbol: string]: {
    quote: StockQuote;
    fetchedAt: number;
  };
}

// Cache duration: 5 minutes (Alpha Vantage has rate limits)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache to avoid hitting rate limits
const quotesCache: StockQuoteCache = {};

export function useStockQuote(symbol: string | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stock-quote', symbol],
    queryFn: async (): Promise<StockQuote | null> => {
      if (!symbol || !user) return null;

      // Check in-memory cache first
      const cached = quotesCache[symbol];
      if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION) {
        console.log(`Using cached quote for ${symbol}`);
        return cached.quote;
      }

      console.log(`Fetching fresh quote for ${symbol}`);
      
      const { data, error } = await supabase.functions.invoke('get-stock-quote', {
        body: { symbol },
      });

      if (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        throw error;
      }

      if (data?.error) {
        console.error(`API error for ${symbol}:`, data.error);
        // Return cached data if available, even if expired
        if (cached) {
          console.log(`Using stale cache for ${symbol} due to API error`);
          return cached.quote;
        }
        throw new Error(data.error);
      }

      // Store in cache
      quotesCache[symbol] = {
        quote: data as StockQuote,
        fetchedAt: Date.now(),
      };

      return data as StockQuote;
    },
    enabled: !!symbol && !!user,
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
    retry: 1,
    retryDelay: 5000,
  });
}

export function useMultipleStockQuotes(symbols: (string | null | undefined)[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filter out null/undefined and duplicates
  const validSymbols = [...new Set(symbols.filter((s): s is string => !!s))];

  return useQuery({
    queryKey: ['stock-quotes-batch', validSymbols.sort().join(',')],
    queryFn: async (): Promise<Record<string, StockQuote>> => {
      if (!user || validSymbols.length === 0) return {};

      const results: Record<string, StockQuote> = {};
      const symbolsToFetch: string[] = [];

      // Check cache for each symbol
      for (const symbol of validSymbols) {
        const cached = quotesCache[symbol];
        if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION) {
          results[symbol] = cached.quote;
        } else {
          symbolsToFetch.push(symbol);
        }
      }

      // Fetch missing quotes one by one (Alpha Vantage doesn't have batch endpoint)
      // We limit to 5 requests to avoid rate limits
      const symbolsToFetchLimited = symbolsToFetch.slice(0, 5);
      
      for (const symbol of symbolsToFetchLimited) {
        try {
          const { data, error } = await supabase.functions.invoke('get-stock-quote', {
            body: { symbol },
          });

          if (!error && data && !data.error) {
            results[symbol] = data as StockQuote;
            quotesCache[symbol] = {
              quote: data as StockQuote,
              fetchedAt: Date.now(),
            };
            
            // Update individual query cache
            queryClient.setQueryData(['stock-quote', symbol], data);
          }
          
          // Small delay between requests to be nice to the API
          if (symbolsToFetchLimited.indexOf(symbol) < symbolsToFetchLimited.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error(`Failed to fetch quote for ${symbol}:`, err);
          // Use stale cache if available
          const staleCache = quotesCache[symbol];
          if (staleCache) {
            results[symbol] = staleCache.quote;
          }
        }
      }

      return results;
    },
    enabled: !!user && validSymbols.length > 0,
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
    retry: 0,
  });
}

// Helper to calculate portfolio values
export function calculatePortfolioWithQuotes(
  investments: Array<{
    id: string;
    ticker: string | null;
    quantity: number | null;
    average_price: number;
    name: string;
    type: string;
  }>,
  quotes: Record<string, StockQuote>
) {
  let totalInvested = 0;
  let currentValue = 0;

  const enrichedInvestments = investments.map((inv) => {
    const invested = (inv.quantity || 0) * inv.average_price;
    totalInvested += invested;

    let currentPrice = inv.average_price; // Default to average price
    let change = 0;
    let changePercent = '0%';

    if (inv.ticker && quotes[inv.ticker]) {
      const quote = quotes[inv.ticker];
      currentPrice = quote.price;
      change = quote.change;
      changePercent = quote.changePercent;
    }

    const current = (inv.quantity || 0) * currentPrice;
    currentValue += current;

    const gainLoss = current - invested;
    const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

    return {
      ...inv,
      invested,
      currentPrice,
      currentValue: current,
      change,
      changePercent,
      gainLoss,
      gainLossPercent,
    };
  });

  const totalGainLoss = currentValue - totalInvested;
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return {
    investments: enrichedInvestments,
    totalInvested,
    currentValue,
    totalGainLoss,
    totalGainLossPercent,
  };
}
