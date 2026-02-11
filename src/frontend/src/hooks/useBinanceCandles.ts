import { useQuery } from '@tanstack/react-query';
import { Candle } from '@/lib/technicalIndicators';

export type BinanceInterval = '3m' | '15m' | '1h';

export function useBinanceCandles(symbol: string, interval: BinanceInterval, limit: number = 100) {
  return useQuery<Candle[]>({
    queryKey: ['binanceCandles', symbol, interval, limit],
    queryFn: async () => {
      if (!symbol) {
        throw new Error('Symbol is required');
      }

      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 400) {
          throw new Error('Invalid symbol or interval');
        }
        throw new Error(`Failed to fetch candles: ${response.status}`);
      }

      const klines = await response.json();

      return klines.map((k: any) => ({
        timestamp: parseInt(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
    },
    enabled: !!symbol,
    refetchInterval: interval === '3m' ? 3 * 60 * 1000 : interval === '15m' ? 15 * 60 * 1000 : 60 * 60 * 1000,
    staleTime: interval === '3m' ? 3 * 60 * 1000 : interval === '15m' ? 15 * 60 * 1000 : 60 * 60 * 1000,
    retry: 2,
  });
}
