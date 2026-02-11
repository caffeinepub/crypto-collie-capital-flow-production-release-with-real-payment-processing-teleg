import { useQuery } from '@tanstack/react-query';
import { Candle } from '@/lib/technicalIndicators';

export function useThreeMinuteCandles(symbol: string, limit: number = 100) {
  return useQuery<Candle[]>({
    queryKey: ['threeMinuteCandles', symbol, limit],
    queryFn: async () => {
      if (!symbol) {
        throw new Error('Symbol is required');
      }

      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=3m&limit=${limit}`,
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
          throw new Error('Invalid symbol');
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
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });
}
