// Technical indicator utilities for 3m candle analysis

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // Start with SMA for first value
  const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(sma);
  
  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const currentEma = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEma);
  }
  
  return ema;
}

export function detectSwingHighLow(candles: Candle[], lookback: number = 5): {
  swingHighs: number[];
  swingLows: number[];
} {
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];
    
    // Check for swing high
    let isSwingHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high >= current.high) {
        isSwingHigh = false;
        break;
      }
    }
    if (isSwingHigh) swingHighs.push(i);
    
    // Check for swing low
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low <= current.low) {
        isSwingLow = false;
        break;
      }
    }
    if (isSwingLow) swingLows.push(i);
  }
  
  return { swingHighs, swingLows };
}

export function isEngulfingCandle(prev: Candle, current: Candle): 'bullish' | 'bearish' | null {
  const prevBullish = prev.close > prev.open;
  const currentBullish = current.close > current.open;
  
  // Bullish engulfing
  if (!prevBullish && currentBullish && 
      current.open <= prev.close && 
      current.close >= prev.open) {
    return 'bullish';
  }
  
  // Bearish engulfing
  if (prevBullish && !currentBullish && 
      current.open >= prev.close && 
      current.close <= prev.open) {
    return 'bearish';
  }
  
  return null;
}

export function isPinBar(candle: Candle): 'bullish' | 'bearish' | null {
  const body = Math.abs(candle.close - candle.open);
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const totalRange = candle.high - candle.low;
  
  if (totalRange === 0) return null;
  
  // Bullish pin bar (hammer)
  if (lowerWick > body * 2 && upperWick < body && lowerWick > totalRange * 0.6) {
    return 'bullish';
  }
  
  // Bearish pin bar (shooting star)
  if (upperWick > body * 2 && lowerWick < body && upperWick > totalRange * 0.6) {
    return 'bearish';
  }
  
  return null;
}
