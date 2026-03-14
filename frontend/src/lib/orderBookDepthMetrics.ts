import { OrderBookLevel } from '@/hooks/useBinanceOrderBookDepth';

export interface DepthMetrics {
  bestBid: number;
  bestAsk: number;
  midPrice: number;
  spreadAbsolute: number;
  spreadPercent: number;
  bidDepthTotal: number;
  askDepthTotal: number;
  depthImbalance: number;
  depthImbalancePercent: number;
}

export interface CumulativeLevel extends OrderBookLevel {
  cumulative: number;
}

export interface LiquidityWall {
  price: number;
  quantity: number;
  isBid: boolean;
  isWall: boolean;
}

export function calculateDepthMetrics(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
  displayLimit: number
): DepthMetrics | null {
  if (bids.length === 0 || asks.length === 0) {
    return null;
  }

  const displayBids = bids.slice(0, displayLimit);
  const displayAsks = asks.slice(0, displayLimit);

  const bestBid = displayBids[0].price;
  const bestAsk = displayAsks[0].price;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadAbsolute = bestAsk - bestBid;
  const spreadPercent = (spreadAbsolute / midPrice) * 100;

  const bidDepthTotal = displayBids.reduce((sum, level) => sum + level.quantity, 0);
  const askDepthTotal = displayAsks.reduce((sum, level) => sum + level.quantity, 0);

  const totalDepth = bidDepthTotal + askDepthTotal;
  const depthImbalance = bidDepthTotal - askDepthTotal;
  const depthImbalancePercent = totalDepth > 0 ? (depthImbalance / totalDepth) * 100 : 0;

  return {
    bestBid,
    bestAsk,
    midPrice,
    spreadAbsolute,
    spreadPercent,
    bidDepthTotal,
    askDepthTotal,
    depthImbalance,
    depthImbalancePercent,
  };
}

export function calculateCumulativeDepth(levels: OrderBookLevel[]): CumulativeLevel[] {
  let cumulative = 0;
  return levels.map((level) => {
    cumulative += level.quantity;
    return {
      ...level,
      cumulative,
    };
  });
}

export function detectLiquidityWalls(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
  thresholdPercent: number
): LiquidityWall[] {
  const allLevels = [...bids, ...asks];
  if (allLevels.length === 0) return [];

  const maxQuantity = Math.max(...allLevels.map((l) => l.quantity));
  const threshold = maxQuantity * (thresholdPercent / 100);

  const bidWalls = bids
    .map((bid) => ({
      price: bid.price,
      quantity: bid.quantity,
      isBid: true,
      isWall: bid.quantity >= threshold,
    }))
    .filter((w) => w.isWall);

  const askWalls = asks
    .map((ask) => ({
      price: ask.price,
      quantity: ask.quantity,
      isBid: false,
      isWall: ask.quantity >= threshold,
    }))
    .filter((w) => w.isWall);

  return [...bidWalls, ...askWalls];
}

export function getNormalizationMax(bids: CumulativeLevel[], asks: CumulativeLevel[]): number {
  const maxBid = bids.length > 0 ? bids[bids.length - 1].cumulative : 0;
  const maxAsk = asks.length > 0 ? asks[asks.length - 1].cumulative : 0;
  return Math.max(maxBid, maxAsk);
}
