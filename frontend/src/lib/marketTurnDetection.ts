// Unified market turn detection: major regime reversals + micro-turns
import { Candle, calculateEMA } from './technicalIndicators';

export type TurnType = 'major' | 'micro';
export type TurnDirection = 'upward' | 'downward';

export interface MarketTurn {
  detected: boolean;
  direction: TurnDirection | null;
  type: TurnType | null;
  timestamp: number | null;
  interval: string | null;
  confidence: number;
  reason: string;
}

export interface UnifiedTurnResult {
  turn: MarketTurn;
  ema20: number | null;
  ema50: number | null;
  debugInfo: {
    majorTurnDetected: boolean;
    microTurnDetected: boolean;
    candleCount: number;
  };
}

/**
 * Detects major regime reversals using EMA crossover
 */
function detectMajorTurn(candles: Candle[], interval: string): MarketTurn {
  if (candles.length < 50) {
    return {
      detected: false,
      direction: null,
      type: null,
      timestamp: null,
      interval: null,
      confidence: 0,
      reason: 'Insufficient data for major turn detection',
    };
  }

  const closes = candles.map(c => c.close);
  const ema20Array = calculateEMA(closes, 20);
  const ema50Array = calculateEMA(closes, 50);

  if (ema20Array.length < 3 || ema50Array.length < 3) {
    return {
      detected: false,
      direction: null,
      type: null,
      timestamp: null,
      interval: null,
      confidence: 0,
      reason: 'Insufficient EMA data',
    };
  }

  const len = Math.min(ema20Array.length, ema50Array.length);
  const current = { ema20: ema20Array[len - 1], ema50: ema50Array[len - 1] };
  const prev1 = { ema20: ema20Array[len - 2], ema50: ema50Array[len - 2] };
  const prev2 = { ema20: ema20Array[len - 3], ema50: ema50Array[len - 3] };

  // Detect crossover with 2-candle confirmation
  const bullishCross = prev2.ema20 <= prev2.ema50 && prev1.ema20 > prev1.ema50 && current.ema20 > current.ema50;
  const bearishCross = prev2.ema20 >= prev2.ema50 && prev1.ema20 < prev1.ema50 && current.ema20 < current.ema50;

  if (bullishCross) {
    return {
      detected: true,
      direction: 'upward',
      type: 'major',
      timestamp: candles[candles.length - 1].timestamp,
      interval,
      confidence: 0.85,
      reason: 'EMA20 crossed above EMA50 with confirmation',
    };
  }

  if (bearishCross) {
    return {
      detected: true,
      direction: 'downward',
      type: 'major',
      timestamp: candles[candles.length - 1].timestamp,
      interval,
      confidence: 0.85,
      reason: 'EMA20 crossed below EMA50 with confirmation',
    };
  }

  return {
    detected: false,
    direction: null,
    type: null,
    timestamp: null,
    interval: null,
    confidence: 0,
    reason: 'No major turn detected',
  };
}

/**
 * Detects micro-turns: exhaustion patterns, swing structure breaks, reversal candles
 */
function detectMicroTurn(candles: Candle[], interval: string): MarketTurn {
  if (candles.length < 10) {
    return {
      detected: false,
      direction: null,
      type: null,
      timestamp: null,
      interval: null,
      confidence: 0,
      reason: 'Insufficient data for micro-turn detection',
    };
  }

  const recent = candles.slice(-10);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];

  // Calculate swing highs/lows
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  const closes = recent.map(c => c.close);

  const recentHigh = Math.max(...highs.slice(-5));
  const recentLow = Math.min(...lows.slice(-5));

  // Detect bullish reversal patterns
  const bullishEngulfing = prev.close < prev.open && last.close > last.open && last.close > prev.open && last.open < prev.close;
  const hammerPattern = (last.close > last.open) && ((last.high - last.close) < (last.close - last.open) * 0.3) && ((last.close - last.low) > (last.close - last.open) * 2);
  const bullishExhaustion = closes[closes.length - 3] < closes[closes.length - 2] && closes[closes.length - 2] < closes[closes.length - 1] && last.low <= recentLow * 1.002;

  if (bullishEngulfing || hammerPattern || bullishExhaustion) {
    const reason = bullishEngulfing ? 'Bullish engulfing pattern' : hammerPattern ? 'Hammer reversal pattern' : 'Bullish exhaustion at support';
    return {
      detected: true,
      direction: 'upward',
      type: 'micro',
      timestamp: last.timestamp,
      interval,
      confidence: 0.70,
      reason,
    };
  }

  // Detect bearish reversal patterns
  const bearishEngulfing = prev.close > prev.open && last.close < last.open && last.close < prev.open && last.open > prev.close;
  const shootingStarPattern = (last.close < last.open) && ((last.close - last.low) < (last.open - last.close) * 0.3) && ((last.high - last.open) > (last.open - last.close) * 2);
  const bearishExhaustion = closes[closes.length - 3] > closes[closes.length - 2] && closes[closes.length - 2] > closes[closes.length - 1] && last.high >= recentHigh * 0.998;

  if (bearishEngulfing || shootingStarPattern || bearishExhaustion) {
    const reason = bearishEngulfing ? 'Bearish engulfing pattern' : shootingStarPattern ? 'Shooting star reversal pattern' : 'Bearish exhaustion at resistance';
    return {
      detected: true,
      direction: 'downward',
      type: 'micro',
      timestamp: last.timestamp,
      interval,
      confidence: 0.70,
      reason,
    };
  }

  return {
    detected: false,
    direction: null,
    type: null,
    timestamp: null,
    interval: null,
    confidence: 0,
    reason: 'No micro-turn detected',
  };
}

/**
 * Unified market turn detection: checks both major and micro turns
 * Returns the highest-confidence turn detected
 */
export function detectUnifiedMarketTurn(candles: Candle[], interval: string): UnifiedTurnResult {
  const majorTurn = detectMajorTurn(candles, interval);
  const microTurn = detectMicroTurn(candles, interval);

  const closes = candles.map(c => c.close);
  const ema20Array = calculateEMA(closes, 20);
  const ema50Array = calculateEMA(closes, 50);

  const ema20 = ema20Array.length > 0 ? ema20Array[ema20Array.length - 1] : null;
  const ema50 = ema50Array.length > 0 ? ema50Array[ema50Array.length - 1] : null;

  // Prioritize major turns over micro turns
  let selectedTurn: MarketTurn;
  if (majorTurn.detected) {
    selectedTurn = majorTurn;
  } else if (microTurn.detected) {
    selectedTurn = microTurn;
  } else {
    selectedTurn = {
      detected: false,
      direction: null,
      type: null,
      timestamp: null,
      interval: null,
      confidence: 0,
      reason: 'No turn detected',
    };
  }

  return {
    turn: selectedTurn,
    ema20,
    ema50,
    debugInfo: {
      majorTurnDetected: majorTurn.detected,
      microTurnDetected: microTurn.detected,
      candleCount: candles.length,
    },
  };
}

/**
 * Generates a stable key for turn event deduplication
 */
export function getTurnEventKey(symbol: string, turn: MarketTurn): string {
  if (!turn.detected || !turn.timestamp || !turn.direction || !turn.type) {
    return '';
  }
  return `${symbol}-${turn.direction}-${turn.type}-${turn.interval}-${turn.timestamp}`;
}
