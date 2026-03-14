import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { THREE_MINUTE_TIMEFRAME } from '@/lib/timeframes';

export function useThreeMinuteTimeframe() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string>({
    queryKey: ['threeMinuteTimeframe'],
    queryFn: async () => {
      if (!actor) return THREE_MINUTE_TIMEFRAME;
      try {
        return await actor.getThreeMinuteTimeframe();
      } catch (error) {
        console.warn('Failed to fetch timeframe from backend, using local constant:', error);
        return THREE_MINUTE_TIMEFRAME;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
    placeholderData: THREE_MINUTE_TIMEFRAME,
  });
}
