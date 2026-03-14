import { useBinanceCandles, BinanceInterval } from './useBinanceCandles';
import { Candle } from '@/lib/technicalIndicators';

export interface MultiIntervalCandleData {
  interval: BinanceInterval;
  candles: Candle[] | null;
  isLoading: boolean;
  error: Error | null;
}

export interface MultiIntervalResult {
  intervals: MultiIntervalCandleData[];
  hasAnyData: boolean;
  allLoading: boolean;
  hasErrors: boolean;
}

export function useMarketMultiIntervalCandles(symbol: string, limit: number = 100): MultiIntervalResult {
  const intervals: BinanceInterval[] = ['3m', '15m', '1h'];

  const query3m = useBinanceCandles(symbol, '3m', limit);
  const query15m = useBinanceCandles(symbol, '15m', limit);
  const query1h = useBinanceCandles(symbol, '1h', limit);

  const queries = [query3m, query15m, query1h];

  const intervalData: MultiIntervalCandleData[] = intervals.map((interval, idx) => ({
    interval,
    candles: queries[idx].data || null,
    isLoading: queries[idx].isLoading,
    error: queries[idx].error as Error | null,
  }));

  const hasAnyData = intervalData.some(d => d.candles !== null && d.candles.length > 0);
  const allLoading = intervalData.every(d => d.isLoading);
  const hasErrors = intervalData.some(d => d.error !== null);

  return {
    intervals: intervalData,
    hasAnyData,
    allLoading,
    hasErrors,
  };
}
