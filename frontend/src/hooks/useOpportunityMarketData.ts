// Hook to fetch market data for opportunity recognition

import { useQuery } from '@tanstack/react-query';
import { Candle } from '@/lib/technicalIndicators';
import { OrderBookDepth } from './useBinanceOrderBookDepth';

interface MarketDataInput {
  symbol: string;
  interval: string;
  limit: number;
}

interface MarketDataResult {
  candles: Candle[];
  orderBook?: OrderBookDepth;
  interval: string;
}

export function useOpportunityMarketData(symbols: string[], intervals: string[]) {
  return useQuery<Map<string, Map<string, MarketDataResult>>>({
    queryKey: ['opportunityMarketData', symbols, intervals],
    queryFn: async () => {
      const resultMap = new Map<string, Map<string, MarketDataResult>>();

      // Fetch data for each symbol and interval
      for (const symbol of symbols) {
        const symbolData = new Map<string, MarketDataResult>();

        for (const interval of intervals) {
          try {
            // Fetch candles
            const candlesResponse = await fetch(
              `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=100`,
              {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
              }
            );

            if (!candlesResponse.ok) {
              console.warn(`Failed to fetch candles for ${symbol} ${interval}`);
              continue;
            }

            const klines = await candlesResponse.json();
            const candles: Candle[] = klines.map((k: any) => ({
              timestamp: parseInt(k[0]),
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
            }));

            // Optionally fetch order book for shortest interval only
            let orderBook: OrderBookDepth | undefined;
            if (interval === intervals[0]) {
              try {
                const obResponse = await fetch(
                  `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=20`,
                  {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store',
                  }
                );

                if (obResponse.ok) {
                  const obData = await obResponse.json();
                  orderBook = {
                    bids: obData.bids.map(([price, quantity]: [string, string]) => ({
                      price: parseFloat(price),
                      quantity: parseFloat(quantity),
                    })),
                    asks: obData.asks.map(([price, quantity]: [string, string]) => ({
                      price: parseFloat(price),
                      quantity: parseFloat(quantity),
                    })),
                    lastUpdateId: obData.lastUpdateId,
                  };
                }
              } catch (e) {
                // Order book fetch failed, continue without it
              }
            }

            symbolData.set(interval, {
              candles,
              orderBook,
              interval,
            });
          } catch (error) {
            console.warn(`Error fetching data for ${symbol} ${interval}:`, error);
          }
        }

        if (symbolData.size > 0) {
          resultMap.set(symbol, symbolData);
        }
      }

      return resultMap;
    },
    enabled: symbols.length > 0 && intervals.length > 0,
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
