import { useQuery } from '@tanstack/react-query';

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBookDepth {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId: number;
}

export function useBinanceOrderBookDepth(
  symbol: string,
  limit: number = 100,
  refetchInterval: number = 5000
) {
  return useQuery<OrderBookDepth>({
    queryKey: ['orderBookDepth', symbol, limit],
    queryFn: async () => {
      if (!symbol) {
        throw new Error('Symbol is required');
      }

      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 400) {
          throw new Error('Invalid symbol. Please check the symbol and try again.');
        }
        throw new Error(`Failed to fetch order book: ${response.status}`);
      }

      const data = await response.json();

      return {
        bids: data.bids.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        asks: data.asks.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        lastUpdateId: data.lastUpdateId,
      };
    },
    enabled: !!symbol,
    refetchInterval,
    staleTime: refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
