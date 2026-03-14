import { Candle, calculateEMA, detectSwingHighLow, isEngulfingCandle, isPinBar } from './technicalIndicators';

export interface ChecklistSignal {
  step: number;
  label: string;
  status: 'met' | 'not-met' | 'unknown';
  details: string;
}

export interface ChecklistResult {
  signals: ChecklistSignal[];
  trendDirection: 'bullish' | 'bearish' | 'neutral';
  entryPrice: number | null;
  stopLoss: number | null;
  target: number | null;
}

export function calculateChecklistSignals3m(candles: Candle[]): ChecklistResult {
  if (candles.length < 50) {
    return {
      signals: [
        { step: 1, label: 'EMA20/50 Alignment', status: 'unknown', details: 'Insufficient data' },
        { step: 2, label: 'Pullback to Value Zone', status: 'unknown', details: 'Insufficient data' },
        { step: 3, label: 'Reversal Candle', status: 'unknown', details: 'Insufficient data' },
        { step: 4, label: 'Entry Direction', status: 'unknown', details: 'Insufficient data' },
        { step: 5, label: 'Stop Loss', status: 'unknown', details: 'Insufficient data' },
        { step: 6, label: 'Target Level', status: 'unknown', details: 'Insufficient data' },
      ],
      trendDirection: 'neutral',
      entryPrice: null,
      stopLoss: null,
      target: null,
    };
  }

  const closePrices = candles.map(c => c.close);
  const ema20 = calculateEMA(closePrices, 20);
  const ema50 = calculateEMA(closePrices, 50);

  const signals: ChecklistSignal[] = [];
  let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let entryPrice: number | null = null;
  let stopLoss: number | null = null;
  let target: number | null = null;

  // Step 1: EMA20/50 Alignment
  if (ema20.length > 0 && ema50.length > 0) {
    const currentEma20 = ema20[ema20.length - 1];
    const currentEma50 = ema50[ema50.length - 1];
    const prevEma20 = ema20[ema20.length - 2];
    const prevEma50 = ema50[ema50.length - 2];

    const bullishAlignment = currentEma20 > currentEma50 && prevEma20 > prevEma50;
    const bearishAlignment = currentEma20 < currentEma50 && prevEma20 < prevEma50;

    if (bullishAlignment) {
      trendDirection = 'bullish';
      signals.push({
        step: 1,
        label: 'EMA20/50 Alignment',
        status: 'met',
        details: 'Bullish trend: EMA20 above EMA50',
      });
    } else if (bearishAlignment) {
      trendDirection = 'bearish';
      signals.push({
        step: 1,
        label: 'EMA20/50 Alignment',
        status: 'met',
        details: 'Bearish trend: EMA20 below EMA50',
      });
    } else {
      signals.push({
        step: 1,
        label: 'EMA20/50 Alignment',
        status: 'not-met',
        details: 'No clear trend alignment',
      });
    }
  } else {
    signals.push({
      step: 1,
      label: 'EMA20/50 Alignment',
      status: 'unknown',
      details: 'Insufficient data for EMA calculation',
    });
  }

  // Step 2: Pullback to Value Zone
  const { swingHighs, swingLows } = detectSwingHighLow(candles, 5);
  const currentCandle = candles[candles.length - 1];
  const currentEma20 = ema20[ema20.length - 1];

  let pullbackDetected = false;
  if (trendDirection === 'bullish' && swingLows.length > 0) {
    const recentLow = Math.min(...swingLows.slice(-3).map(i => candles[i].low));
    const distanceToEma = Math.abs(currentCandle.close - currentEma20) / currentCandle.close;
    pullbackDetected = distanceToEma < 0.02 && currentCandle.close > recentLow;
  } else if (trendDirection === 'bearish' && swingHighs.length > 0) {
    const recentHigh = Math.max(...swingHighs.slice(-3).map(i => candles[i].high));
    const distanceToEma = Math.abs(currentCandle.close - currentEma20) / currentCandle.close;
    pullbackDetected = distanceToEma < 0.02 && currentCandle.close < recentHigh;
  }

  signals.push({
    step: 2,
    label: 'Pullback to Value Zone',
    status: pullbackDetected ? 'met' : 'not-met',
    details: pullbackDetected
      ? `Price near EMA20 (${currentEma20.toFixed(2)})`
      : 'Waiting for pullback to value zone',
  });

  // Step 3: Reversal Candle
  let reversalDetected = false;
  if (candles.length >= 2) {
    const prevCandle = candles[candles.length - 2];
    const engulfing = isEngulfingCandle(prevCandle, currentCandle);
    const pinBar = isPinBar(currentCandle);

    if (trendDirection === 'bullish' && (engulfing === 'bullish' || pinBar === 'bullish')) {
      reversalDetected = true;
      signals.push({
        step: 3,
        label: 'Reversal Candle',
        status: 'met',
        details: engulfing === 'bullish' ? 'Bullish engulfing detected' : 'Bullish pin bar detected',
      });
    } else if (trendDirection === 'bearish' && (engulfing === 'bearish' || pinBar === 'bearish')) {
      reversalDetected = true;
      signals.push({
        step: 3,
        label: 'Reversal Candle',
        status: 'met',
        details: engulfing === 'bearish' ? 'Bearish engulfing detected' : 'Bearish pin bar detected',
      });
    } else {
      signals.push({
        step: 3,
        label: 'Reversal Candle',
        status: 'not-met',
        details: 'No reversal pattern detected',
      });
    }
  } else {
    signals.push({
      step: 3,
      label: 'Reversal Candle',
      status: 'unknown',
      details: 'Insufficient candles for pattern detection',
    });
  }

  // Step 4: Entry Direction
  if (trendDirection !== 'neutral' && pullbackDetected && reversalDetected) {
    entryPrice = currentCandle.close;
    signals.push({
      step: 4,
      label: 'Entry Direction',
      status: 'met',
      details: `Enter ${trendDirection} at ${entryPrice.toFixed(2)}`,
    });
  } else {
    signals.push({
      step: 4,
      label: 'Entry Direction',
      status: 'not-met',
      details: 'Conditions not met for entry',
    });
  }

  // Step 5: Stop Loss
  if (entryPrice !== null) {
    if (trendDirection === 'bullish' && swingLows.length > 0) {
      const recentLow = Math.min(...swingLows.slice(-2).map(i => candles[i].low));
      stopLoss = recentLow * 0.995; // 0.5% below swing low
      signals.push({
        step: 5,
        label: 'Stop Loss',
        status: 'met',
        details: `Stop at ${stopLoss.toFixed(2)} (below swing low)`,
      });
    } else if (trendDirection === 'bearish' && swingHighs.length > 0) {
      const recentHigh = Math.max(...swingHighs.slice(-2).map(i => candles[i].high));
      stopLoss = recentHigh * 1.005; // 0.5% above swing high
      signals.push({
        step: 5,
        label: 'Stop Loss',
        status: 'met',
        details: `Stop at ${stopLoss.toFixed(2)} (above swing high)`,
      });
    } else {
      signals.push({
        step: 5,
        label: 'Stop Loss',
        status: 'unknown',
        details: 'Unable to determine stop level',
      });
    }
  } else {
    signals.push({
      step: 5,
      label: 'Stop Loss',
      status: 'not-met',
      details: 'Entry not confirmed',
    });
  }

  // Step 6: Target Level
  if (entryPrice !== null && stopLoss !== null) {
    const risk = Math.abs(entryPrice - stopLoss);
    const rewardRatio = 2; // 1:2 risk-reward
    
    if (trendDirection === 'bullish') {
      target = entryPrice + (risk * rewardRatio);
    } else if (trendDirection === 'bearish') {
      target = entryPrice - (risk * rewardRatio);
    }

    signals.push({
      step: 6,
      label: 'Target Level',
      status: 'met',
      details: `Target at ${target?.toFixed(2)} (1:${rewardRatio} R:R)`,
    });
  } else {
    signals.push({
      step: 6,
      label: 'Target Level',
      status: 'not-met',
      details: 'Entry and stop required for target',
    });
  }

  return {
    signals,
    trendDirection,
    entryPrice,
    stopLoss,
    target,
  };
}
