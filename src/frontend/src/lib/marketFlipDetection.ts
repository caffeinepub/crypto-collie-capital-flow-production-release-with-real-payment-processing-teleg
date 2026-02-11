// Market flip detection utility for closed-candle bull↔bear regime changes
// NOTE: This module is now supplemented by marketTurnDetection.ts for unified turn detection
import { Candle, calculateEMA } from './technicalIndicators';

export type MarketRegime = 'Bull' | 'Bear' | 'Neutral' | 'Transition';
export type FlipDirection = 'Bull→Bear' | 'Bear→Bull' | null;

export interface FlipDetectionResult {
  currentRegime: MarketRegime;
  lastFlipDirection: FlipDirection;
  flipTimestamp: number | null;
  ema20: number | null;
  ema50: number | null;
  confirmationCandles: number;
}

/**
 * Detects market regime flips using EMA20/EMA50 crossover with confirmation.
 * 
 * Rules:
 * - Bull regime: EMA20 > EMA50 for N consecutive closed candles
 * - Bear regime: EMA20 < EMA50 for N consecutive closed candles
 * - Transition: During confirmation period after initial cross
 * - Neutral: Insufficient data or EMAs too close
 * 
 * @param candles Array of closed candles (oldest first)
 * @param confirmationPeriod Number of candles needed to confirm flip (default: 3)
 * @returns FlipDetectionResult with current regime and last flip info
 */
export function detectMarketFlip(
  candles: Candle[],
  confirmationPeriod: number = 3
): FlipDetectionResult {
  // Need at least 50 candles for EMA50
  if (candles.length < 50) {
    return {
      currentRegime: 'Neutral',
      lastFlipDirection: null,
      flipTimestamp: null,
      ema20: null,
      ema50: null,
      confirmationCandles: 0,
    };
  }

  const closes = candles.map(c => c.close);
  const ema20Array = calculateEMA(closes, 20);
  const ema50Array = calculateEMA(closes, 50);

  if (ema20Array.length === 0 || ema50Array.length === 0) {
    return {
      currentRegime: 'Neutral',
      lastFlipDirection: null,
      flipTimestamp: null,
      ema20: null,
      ema50: null,
      confirmationCandles: 0,
    };
  }

  // Current EMA values
  const currentEma20 = ema20Array[ema20Array.length - 1];
  const currentEma50 = ema50Array[ema50Array.length - 1];

  // Scan backwards to find the most recent confirmed flip
  let lastFlipDirection: FlipDirection = null;
  let flipTimestamp: number | null = null;
  let currentRegime: MarketRegime = 'Neutral';

  // Start from the most recent candle and work backwards
  const startIdx = Math.min(ema20Array.length, ema50Array.length) - 1;
  
  // Determine current regime based on recent alignment
  let bullishCount = 0;
  let bearishCount = 0;
  
  for (let i = startIdx; i >= Math.max(0, startIdx - confirmationPeriod); i--) {
    if (ema20Array[i] > ema50Array[i]) {
      bullishCount++;
    } else if (ema20Array[i] < ema50Array[i]) {
      bearishCount++;
    }
  }

  if (bullishCount >= confirmationPeriod) {
    currentRegime = 'Bull';
  } else if (bearishCount >= confirmationPeriod) {
    currentRegime = 'Bear';
  } else {
    currentRegime = 'Transition';
  }

  // Find the most recent flip by scanning backwards
  let previousRegime: 'bull' | 'bear' | null = null;
  let consecutiveCount = 0;

  for (let i = startIdx; i >= 0; i--) {
    const isBullish = ema20Array[i] > ema50Array[i];
    const currentState = isBullish ? 'bull' : 'bear';

    if (previousRegime === null) {
      previousRegime = currentState;
      consecutiveCount = 1;
    } else if (currentState === previousRegime) {
      consecutiveCount++;
    } else {
      // We found a regime change
      if (consecutiveCount >= confirmationPeriod) {
        // This is a confirmed flip
        const flipCandleIdx = i + confirmationPeriod;
        const adjustedIdx = flipCandleIdx - (ema20Array.length - candles.length);
        
        if (adjustedIdx >= 0 && adjustedIdx < candles.length) {
          flipTimestamp = candles[adjustedIdx].timestamp;
          lastFlipDirection = previousRegime === 'bull' ? 'Bear→Bull' : 'Bull→Bear';
          break;
        }
      }
      previousRegime = currentState;
      consecutiveCount = 1;
    }
  }

  return {
    currentRegime,
    lastFlipDirection,
    flipTimestamp,
    ema20: currentEma20,
    ema50: currentEma50,
    confirmationCandles: confirmationPeriod,
  };
}

/**
 * Generates a stable key for a flip event to prevent duplicate notifications
 */
export function getFlipKey(symbol: string, direction: FlipDirection, timestamp: number | null): string {
  if (!direction || !timestamp) return '';
  return `${symbol}-${direction}-${timestamp}`;
}
