// Hook for Opportunity Recognition ranking with multi-strategy support

import { useQuery } from '@tanstack/react-query';
import { StrategyModality, scoreOpportunity, OpportunityScore } from '@/lib/opportunityScoring';
import { useOpportunityMarketData } from './useOpportunityMarketData';
import { getBinanceIntervals } from '@/lib/opportunityTimeframes';

// Top Binance Futures USDT perpetual symbols
const DEFAULT_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'MATICUSDT',
  'DOTUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'UNIUSDT',
  'ATOMUSDT',
  'LTCUSDT',
  'NEARUSDT',
  'APTUSDT',
  'ARBUSDT',
  'OPUSDT',
  'INJUSDT',
  'SUIUSDT',
];

export function useOpportunityRecognitionRanking(
  modality: StrategyModality,
  timeframeIds: string[],
  limit: number = 20
) {
  const intervals = getBinanceIntervals(timeframeIds);
  const { data: marketData, isLoading: marketDataLoading, error: marketDataError } = useOpportunityMarketData(
    DEFAULT_SYMBOLS,
    intervals
  );

  return useQuery<OpportunityScore[]>({
    queryKey: ['opportunityRanking', modality, timeframeIds, limit],
    queryFn: async () => {
      if (!marketData || marketData.size === 0) {
        return [];
      }

      const scores: OpportunityScore[] = [];

      // Score each symbol
      for (const [symbol, symbolData] of marketData.entries()) {
        try {
          const score = scoreOpportunity(symbol, modality, symbolData);
          scores.push(score);
        } catch (error) {
          console.warn(`Error scoring ${symbol}:`, error);
        }
      }

      // Sort by score (highest first)
      scores.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Tie-breaker: alphabetical
        return a.symbol.localeCompare(b.symbol);
      });

      // Return top N
      return scores.slice(0, limit);
    },
    enabled: !!marketData && !marketDataLoading && intervals.length > 0,
    refetchInterval: 3 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
