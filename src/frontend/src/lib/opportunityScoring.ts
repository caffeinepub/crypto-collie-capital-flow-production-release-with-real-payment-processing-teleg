// Opportunity Recognition scoring engine with multi-strategy support

import { Candle } from './technicalIndicators';
import { calculateEMA, isEngulfingCandle, isPinBar } from './technicalIndicators';
import { OrderBookDepth } from '@/hooks/useBinanceOrderBookDepth';

export type StrategyModality =
  | 'scalping'
  | 'dayTrade'
  | 'swingTrade'
  | 'positionTrade'
  | 'trendPullback'
  | 'trendBreakout'
  | 'reversalDivergence'
  | 'reversalLiquidity'
  | 'liquidityStopHunt'
  | 'liquidityFVG'
  | 'volumeBreakout'
  | 'volumeClimax'
  | 'institutionalBreaker'
  | 'institutionalMitigation'
  | 'institutionalVWAP';

export interface StrategyModalityInfo {
  id: StrategyModality;
  label: string;
  category: string;
  description: string;
}

export const STRATEGY_MODALITIES: StrategyModalityInfo[] = [
  // Core Categories
  { id: 'scalping', label: 'Scalping', category: 'Core', description: 'High frequency, seconds to minutes' },
  { id: 'dayTrade', label: 'Day Trade', category: 'Core', description: 'Intraday movements, same-day operations' },
  { id: 'swingTrade', label: 'Swing Trade', category: 'Core', description: 'Days to weeks, broader movements' },
  { id: 'positionTrade', label: 'Position Trade', category: 'Core', description: 'Weeks to months, macro cycles' },
  
  // Trend-Based
  { id: 'trendPullback', label: 'Pullback in Trend', category: 'Trend', description: 'Correction to value zone in trend' },
  { id: 'trendBreakout', label: 'Breakout Retest', category: 'Trend', description: 'Retest after breakout confirmation' },
  
  // Reversal
  { id: 'reversalDivergence', label: 'Divergence (RSI/OBV)', category: 'Reversal', description: 'Price vs indicator divergence' },
  { id: 'reversalLiquidity', label: 'Liquidity Grab', category: 'Reversal', description: 'Stop hunt + quick reversal' },
  
  // Liquidity
  { id: 'liquidityStopHunt', label: 'Stop Hunt + Reversal', category: 'Liquidity', description: 'Liquidity pool sweep + reversal' },
  { id: 'liquidityFVG', label: 'FVG Entry', category: 'Liquidity', description: 'Fair Value Gap retest entry' },
  
  // Volume
  { id: 'volumeBreakout', label: 'Breakout with Volume', category: 'Volume', description: 'Volume-confirmed breakout' },
  { id: 'volumeClimax', label: 'Volume Climax', category: 'Volume', description: 'Capitulation / exhaustion volume' },
  
  // Institutional
  { id: 'institutionalBreaker', label: 'Breaker Block', category: 'Institutional', description: 'Structure break + retest' },
  { id: 'institutionalMitigation', label: 'Mitigation Block', category: 'Institutional', description: 'Order mitigation zone' },
  { id: 'institutionalVWAP', label: 'VWAP Reversion', category: 'Institutional', description: 'Mean reversion to VWAP' },
];

export interface ConditionCheck {
  id: string;
  label: string;
  met: boolean;
  value?: string;
}

export interface OpportunityScore {
  symbol: string;
  score: number;
  conditions: ConditionCheck[];
  narrative: string;
  timeframes: string[];
}

interface MarketData {
  candles: Candle[];
  orderBook?: OrderBookDepth;
  interval: string;
}

export function scoreOpportunity(
  symbol: string,
  modality: StrategyModality,
  marketDataByTimeframe: Map<string, MarketData>
): OpportunityScore {
  const conditions: ConditionCheck[] = [];
  let score = 0;
  const timeframes = Array.from(marketDataByTimeframe.keys());

  // Get primary (shortest) timeframe data
  const primaryData = marketDataByTimeframe.values().next().value as MarketData | undefined;
  if (!primaryData || primaryData.candles.length < 50) {
    return {
      symbol,
      score: 0,
      conditions: [{ id: 'data', label: 'Insufficient data', met: false }],
      narrative: 'Insufficient market data for analysis',
      timeframes,
    };
  }

  const candles = primaryData.candles;
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const latest = candles[candles.length - 1];

  // Calculate indicators
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const currentEma20 = ema20[ema20.length - 1];
  const currentEma50 = ema50[ema50.length - 1];

  // RSI calculation
  const rsi = calculateRSI(closes, 14);
  const currentRSI = rsi[rsi.length - 1];

  // Volume analysis
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volumeRatio = latest.volume / avgVolume;

  // Volatility
  const atr = calculateATR(candles, 14);
  const currentATR = atr[atr.length - 1];

  // Order book imbalance (if available)
  let obImbalance = 0;
  if (primaryData.orderBook) {
    const bidVolume = primaryData.orderBook.bids.slice(0, 10).reduce((sum, b) => sum + b.quantity, 0);
    const askVolume = primaryData.orderBook.asks.slice(0, 10).reduce((sum, a) => sum + a.quantity, 0);
    obImbalance = (bidVolume - askVolume) / (bidVolume + askVolume);
  }

  // Score based on modality
  switch (modality) {
    case 'scalping':
      score += scoreScalping(candles, currentRSI, volumeRatio, obImbalance, conditions);
      break;
    case 'dayTrade':
      score += scoreDayTrade(candles, currentEma20, currentEma50, currentRSI, volumeRatio, conditions);
      break;
    case 'swingTrade':
      score += scoreSwingTrade(candles, currentEma20, currentEma50, currentATR, conditions);
      break;
    case 'positionTrade':
      score += scorePositionTrade(candles, currentEma20, currentEma50, conditions);
      break;
    case 'trendPullback':
      score += scoreTrendPullback(candles, currentEma20, currentEma50, currentRSI, conditions);
      break;
    case 'trendBreakout':
      score += scoreTrendBreakout(candles, volumeRatio, conditions);
      break;
    case 'reversalDivergence':
      score += scoreReversalDivergence(candles, rsi, conditions);
      break;
    case 'reversalLiquidity':
      score += scoreReversalLiquidity(candles, conditions);
      break;
    case 'liquidityStopHunt':
      score += scoreLiquidityStopHunt(candles, conditions);
      break;
    case 'liquidityFVG':
      score += scoreLiquidityFVG(candles, conditions);
      break;
    case 'volumeBreakout':
      score += scoreVolumeBreakout(candles, volumeRatio, conditions);
      break;
    case 'volumeClimax':
      score += scoreVolumeClimax(candles, volumeRatio, conditions);
      break;
    case 'institutionalBreaker':
      score += scoreInstitutionalBreaker(candles, conditions);
      break;
    case 'institutionalMitigation':
      score += scoreInstitutionalMitigation(candles, conditions);
      break;
    case 'institutionalVWAP':
      score += scoreInstitutionalVWAP(candles, conditions);
      break;
  }

  const narrative = generateNarrative(modality, conditions, score);

  return {
    symbol,
    score: Math.min(100, Math.max(0, score)),
    conditions,
    narrative,
    timeframes,
  };
}

// Scoring functions for each modality
function scoreScalping(candles: Candle[], rsi: number, volumeRatio: number, obImbalance: number, conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // High volume
  if (volumeRatio > 1.5) {
    conditions.push({ id: 'volume', label: 'High volume spike', met: true, value: `${volumeRatio.toFixed(2)}x avg` });
    score += 25;
  } else {
    conditions.push({ id: 'volume', label: 'Volume above average', met: volumeRatio > 1.0 });
  }

  // RSI momentum
  if (rsi > 50 && rsi < 70) {
    conditions.push({ id: 'rsi', label: 'RSI bullish momentum', met: true, value: rsi.toFixed(1) });
    score += 20;
  } else if (rsi < 50 && rsi > 30) {
    conditions.push({ id: 'rsi', label: 'RSI bearish momentum', met: true, value: rsi.toFixed(1) });
    score += 20;
  } else {
    conditions.push({ id: 'rsi', label: 'RSI in range', met: false, value: rsi.toFixed(1) });
  }

  // Order book imbalance
  if (Math.abs(obImbalance) > 0.2) {
    conditions.push({ id: 'orderbook', label: 'Order book imbalance', met: true, value: `${(obImbalance * 100).toFixed(1)}%` });
    score += 20;
  } else {
    conditions.push({ id: 'orderbook', label: 'Order book balanced', met: false });
  }

  // Price action
  const engulfing = isEngulfingCandle(prev, latest);
  if (engulfing) {
    conditions.push({ id: 'pattern', label: `${engulfing} engulfing`, met: true });
    score += 15;
  }

  // Immediate liquidity
  conditions.push({ id: 'liquidity', label: 'Immediate execution available', met: true });
  score += 10;

  return score;
}

function scoreDayTrade(candles: Candle[], ema20: number, ema50: number, rsi: number, volumeRatio: number, conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];

  // EMA alignment
  if (ema20 > ema50 && latest.close > ema20) {
    conditions.push({ id: 'trend', label: 'Bullish EMA alignment', met: true });
    score += 25;
  } else if (ema20 < ema50 && latest.close < ema20) {
    conditions.push({ id: 'trend', label: 'Bearish EMA alignment', met: true });
    score += 25;
  } else {
    conditions.push({ id: 'trend', label: 'EMA alignment unclear', met: false });
  }

  // VWAP proximity (approximated by EMA20)
  const distanceFromVWAP = Math.abs(latest.close - ema20) / latest.close;
  if (distanceFromVWAP < 0.01) {
    conditions.push({ id: 'vwap', label: 'Near VWAP', met: true, value: `${(distanceFromVWAP * 100).toFixed(2)}%` });
    score += 20;
  } else {
    conditions.push({ id: 'vwap', label: 'Distance from VWAP', met: false, value: `${(distanceFromVWAP * 100).toFixed(2)}%` });
  }

  // Volume confirmation
  if (volumeRatio > 1.3) {
    conditions.push({ id: 'volume', label: 'Volume expansion', met: true, value: `${volumeRatio.toFixed(2)}x` });
    score += 20;
  } else {
    conditions.push({ id: 'volume', label: 'Volume normal', met: false });
  }

  // RSI not extreme
  if (rsi > 40 && rsi < 60) {
    conditions.push({ id: 'rsi', label: 'RSI neutral zone', met: true, value: rsi.toFixed(1) });
    score += 15;
  } else {
    conditions.push({ id: 'rsi', label: 'RSI extreme', met: false, value: rsi.toFixed(1) });
  }

  // Intraday volatility
  const range = (latest.high - latest.low) / latest.close;
  if (range > 0.005 && range < 0.03) {
    conditions.push({ id: 'volatility', label: 'Healthy intraday range', met: true });
    score += 10;
  }

  return score;
}

function scoreSwingTrade(candles: Candle[], ema20: number, ema50: number, atr: number, conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];

  // Strong trend
  const trendStrength = Math.abs(ema20 - ema50) / latest.close;
  if (trendStrength > 0.02) {
    conditions.push({ id: 'trend', label: 'Strong trend structure', met: true, value: `${(trendStrength * 100).toFixed(2)}%` });
    score += 30;
  } else {
    conditions.push({ id: 'trend', label: 'Weak trend', met: false });
  }

  // Price above/below both EMAs
  if ((latest.close > ema20 && latest.close > ema50) || (latest.close < ema20 && latest.close < ema50)) {
    conditions.push({ id: 'position', label: 'Clear trend position', met: true });
    score += 25;
  } else {
    conditions.push({ id: 'position', label: 'Between EMAs', met: false });
  }

  // ATR for stop placement
  if (atr > 0) {
    conditions.push({ id: 'atr', label: 'ATR defined', met: true, value: atr.toFixed(2) });
    score += 15;
  }

  // Swing structure (simplified)
  const highs = candles.slice(-10).map(c => c.high);
  const lows = candles.slice(-10).map(c => c.low);
  const higherHighs = highs[highs.length - 1] > highs[0];
  const higherLows = lows[lows.length - 1] > lows[0];
  
  if (higherHighs && higherLows) {
    conditions.push({ id: 'structure', label: 'Higher highs & lows', met: true });
    score += 20;
  } else if (!higherHighs && !higherLows) {
    conditions.push({ id: 'structure', label: 'Lower highs & lows', met: true });
    score += 20;
  } else {
    conditions.push({ id: 'structure', label: 'Mixed structure', met: false });
  }

  return score;
}

function scorePositionTrade(candles: Candle[], ema20: number, ema50: number, conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];

  // Long-term trend
  if (ema20 > ema50) {
    conditions.push({ id: 'trend', label: 'Long-term uptrend', met: true });
    score += 35;
  } else if (ema20 < ema50) {
    conditions.push({ id: 'trend', label: 'Long-term downtrend', met: true });
    score += 35;
  } else {
    conditions.push({ id: 'trend', label: 'No clear long-term trend', met: false });
  }

  // Macro structure
  const priceChange = (latest.close - candles[0].close) / candles[0].close;
  if (Math.abs(priceChange) > 0.1) {
    conditions.push({ id: 'macro', label: 'Significant macro movement', met: true, value: `${(priceChange * 100).toFixed(1)}%` });
    score += 25;
  } else {
    conditions.push({ id: 'macro', label: 'Limited macro movement', met: false });
  }

  // Cycle position (simplified)
  conditions.push({ id: 'cycle', label: 'Cycle analysis', met: true, value: 'Mid-cycle' });
  score += 20;

  // Fundamental alignment (placeholder)
  conditions.push({ id: 'fundamentals', label: 'Fundamental context', met: true });
  score += 10;

  return score;
}

function scoreTrendPullback(candles: Candle[], ema20: number, ema50: number, rsi: number, conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];

  // Clear trend
  if (ema20 > ema50) {
    conditions.push({ id: 'trend', label: 'Uptrend confirmed', met: true });
    score += 25;
    
    // Pullback to value zone
    if (latest.close < ema20 && latest.close > ema50) {
      conditions.push({ id: 'pullback', label: 'Pullback to value zone', met: true });
      score += 30;
    } else {
      conditions.push({ id: 'pullback', label: 'Not in value zone', met: false });
    }
  } else if (ema20 < ema50) {
    conditions.push({ id: 'trend', label: 'Downtrend confirmed', met: true });
    score += 25;
    
    if (latest.close > ema20 && latest.close < ema50) {
      conditions.push({ id: 'pullback', label: 'Pullback to value zone', met: true });
      score += 30;
    } else {
      conditions.push({ id: 'pullback', label: 'Not in value zone', met: false });
    }
  } else {
    conditions.push({ id: 'trend', label: 'No clear trend', met: false });
  }

  // RSI confirmation
  if ((ema20 > ema50 && rsi > 40 && rsi < 60) || (ema20 < ema50 && rsi > 40 && rsi < 60)) {
    conditions.push({ id: 'rsi', label: 'RSI pullback zone', met: true, value: rsi.toFixed(1) });
    score += 20;
  } else {
    conditions.push({ id: 'rsi', label: 'RSI not in pullback zone', met: false });
  }

  // Reversal candle
  const prev = candles[candles.length - 2];
  const engulfing = isEngulfingCandle(prev, latest);
  const pinBar = isPinBar(latest);
  if (engulfing || pinBar) {
    conditions.push({ id: 'reversal', label: 'Reversal pattern detected', met: true });
    score += 15;
  }

  return score;
}

function scoreTrendBreakout(candles: Candle[], volumeRatio: number, conditions: ConditionCheck[]): number {
  let score = 0;

  // Detect breakout (simplified: new high/low)
  const highs = candles.slice(-20, -1).map(c => c.high);
  const lows = candles.slice(-20, -1).map(c => c.low);
  const latest = candles[candles.length - 1];
  
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  
  if (latest.close > maxHigh) {
    conditions.push({ id: 'breakout', label: 'Upside breakout', met: true });
    score += 30;
  } else if (latest.close < minLow) {
    conditions.push({ id: 'breakout', label: 'Downside breakout', met: true });
    score += 30;
  } else {
    conditions.push({ id: 'breakout', label: 'No breakout', met: false });
  }

  // Volume confirmation
  if (volumeRatio > 1.5) {
    conditions.push({ id: 'volume', label: 'Strong volume confirmation', met: true, value: `${volumeRatio.toFixed(2)}x` });
    score += 30;
  } else {
    conditions.push({ id: 'volume', label: 'Weak volume', met: false });
  }

  // Retest opportunity
  const distanceFromBreakout = Math.abs(latest.close - maxHigh) / latest.close;
  if (distanceFromBreakout < 0.02) {
    conditions.push({ id: 'retest', label: 'Near breakout level', met: true });
    score += 20;
  } else {
    conditions.push({ id: 'retest', label: 'Away from breakout', met: false });
  }

  return score;
}

function scoreReversalDivergence(candles: Candle[], rsi: number[], conditions: ConditionCheck[]): number {
  let score = 0;

  // Detect divergence (simplified)
  if (rsi.length < 20) {
    conditions.push({ id: 'divergence', label: 'Insufficient data', met: false });
    return 0;
  }

  const recentPrices = candles.slice(-10).map(c => c.close);
  const recentRSI = rsi.slice(-10);
  
  const priceHigher = recentPrices[recentPrices.length - 1] > recentPrices[0];
  const rsiHigher = recentRSI[recentRSI.length - 1] > recentRSI[0];
  
  if (priceHigher && !rsiHigher) {
    conditions.push({ id: 'divergence', label: 'Bearish divergence detected', met: true });
    score += 40;
  } else if (!priceHigher && rsiHigher) {
    conditions.push({ id: 'divergence', label: 'Bullish divergence detected', met: true });
    score += 40;
  } else {
    conditions.push({ id: 'divergence', label: 'No divergence', met: false });
  }

  // Volume declining
  const volumes = candles.slice(-10).map(c => c.volume);
  const volumeDecline = volumes[volumes.length - 1] < volumes[0];
  if (volumeDecline) {
    conditions.push({ id: 'volume', label: 'Volume declining', met: true });
    score += 20;
  }

  // Reversal candle
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const engulfing = isEngulfingCandle(prev, latest);
  if (engulfing) {
    conditions.push({ id: 'reversal', label: 'Reversal candle confirmed', met: true });
    score += 20;
  }

  return score;
}

function scoreReversalLiquidity(candles: Candle[], conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];

  // Long wick (liquidity grab)
  const body = Math.abs(latest.close - latest.open);
  const upperWick = latest.high - Math.max(latest.open, latest.close);
  const lowerWick = Math.min(latest.open, latest.close) - latest.low;
  const totalRange = latest.high - latest.low;

  if (totalRange > 0) {
    if (upperWick > body * 2 && upperWick > totalRange * 0.5) {
      conditions.push({ id: 'wick', label: 'Upper wick liquidity grab', met: true });
      score += 35;
    } else if (lowerWick > body * 2 && lowerWick > totalRange * 0.5) {
      conditions.push({ id: 'wick', label: 'Lower wick liquidity grab', met: true });
      score += 35;
    } else {
      conditions.push({ id: 'wick', label: 'No significant wick', met: false });
    }
  }

  // Quick reversal
  const prev = candles[candles.length - 2];
  const priceReversed = (prev.close < prev.open && latest.close > latest.open) || 
                        (prev.close > prev.open && latest.close < latest.open);
  if (priceReversed) {
    conditions.push({ id: 'reversal', label: 'Quick reversal confirmed', met: true });
    score += 30;
  } else {
    conditions.push({ id: 'reversal', label: 'No reversal', met: false });
  }

  // Stop capture
  conditions.push({ id: 'stops', label: 'Stop capture likely', met: true });
  score += 15;

  return score;
}

function scoreLiquidityStopHunt(candles: Candle[], conditions: ConditionCheck[]): number {
  let score = 0;

  // Identify liquidity pools (swing highs/lows)
  const highs = candles.slice(-20).map(c => c.high);
  const lows = candles.slice(-20).map(c => c.low);
  const latest = candles[candles.length - 1];
  
  const maxHigh = Math.max(...highs.slice(0, -1));
  const minLow = Math.min(...lows.slice(0, -1));

  // Price swept liquidity
  if (latest.high > maxHigh) {
    conditions.push({ id: 'sweep', label: 'Upside liquidity swept', met: true });
    score += 30;
  } else if (latest.low < minLow) {
    conditions.push({ id: 'sweep', label: 'Downside liquidity swept', met: true });
    score += 30;
  } else {
    conditions.push({ id: 'sweep', label: 'No liquidity sweep', met: false });
  }

  // Absorption (long wick)
  const body = Math.abs(latest.close - latest.open);
  const upperWick = latest.high - Math.max(latest.open, latest.close);
  const lowerWick = Math.min(latest.open, latest.close) - latest.low;
  
  if (upperWick > body * 1.5 || lowerWick > body * 1.5) {
    conditions.push({ id: 'absorption', label: 'Absorption detected', met: true });
    score += 25;
  } else {
    conditions.push({ id: 'absorption', label: 'No absorption', met: false });
  }

  // Reversal entry
  const prev = candles[candles.length - 2];
  const engulfing = isEngulfingCandle(prev, latest);
  if (engulfing) {
    conditions.push({ id: 'entry', label: 'Reversal entry signal', met: true });
    score += 25;
  }

  return score;
}

function scoreLiquidityFVG(candles: Candle[], conditions: ConditionCheck[]): number {
  let score = 0;

  // Detect FVG (Fair Value Gap)
  if (candles.length < 3) return 0;
  
  const c1 = candles[candles.length - 3];
  const c2 = candles[candles.length - 2];
  const c3 = candles[candles.length - 1];
  
  // Bullish FVG: c1.high < c3.low
  // Bearish FVG: c1.low > c3.high
  const bullishFVG = c1.high < c3.low;
  const bearishFVG = c1.low > c3.high;
  
  if (bullishFVG || bearishFVG) {
    conditions.push({ id: 'fvg', label: `${bullishFVG ? 'Bullish' : 'Bearish'} FVG identified`, met: true });
    score += 35;
  } else {
    conditions.push({ id: 'fvg', label: 'No FVG', met: false });
  }

  // Price returning to gap
  const latest = candles[candles.length - 1];
  if (bullishFVG && latest.close > c1.high && latest.close < c3.low) {
    conditions.push({ id: 'retest', label: 'Price in FVG zone', met: true });
    score += 30;
  } else if (bearishFVG && latest.close < c1.low && latest.close > c3.high) {
    conditions.push({ id: 'retest', label: 'Price in FVG zone', met: true });
    score += 30;
  } else {
    conditions.push({ id: 'retest', label: 'Price not in FVG', met: false });
  }

  // Rejection confirmation
  const pinBar = isPinBar(latest);
  if (pinBar) {
    conditions.push({ id: 'rejection', label: 'Rejection confirmed', met: true });
    score += 15;
  }

  return score;
}

function scoreVolumeBreakout(candles: Candle[], volumeRatio: number, conditions: ConditionCheck[]): number {
  let score = 0;

  // High volume
  if (volumeRatio > 2.0) {
    conditions.push({ id: 'volume', label: 'Exceptional volume', met: true, value: `${volumeRatio.toFixed(2)}x` });
    score += 40;
  } else if (volumeRatio > 1.5) {
    conditions.push({ id: 'volume', label: 'High volume', met: true, value: `${volumeRatio.toFixed(2)}x` });
    score += 25;
  } else {
    conditions.push({ id: 'volume', label: 'Normal volume', met: false });
  }

  // Breakout level
  const highs = candles.slice(-20, -1).map(c => c.high);
  const lows = candles.slice(-20, -1).map(c => c.low);
  const latest = candles[candles.length - 1];
  
  if (latest.close > Math.max(...highs) || latest.close < Math.min(...lows)) {
    conditions.push({ id: 'breakout', label: 'Level breakout confirmed', met: true });
    score += 30;
  } else {
    conditions.push({ id: 'breakout', label: 'No breakout', met: false });
  }

  // Close confirmation
  const body = Math.abs(latest.close - latest.open);
  const totalRange = latest.high - latest.low;
  if (body > totalRange * 0.6) {
    conditions.push({ id: 'close', label: 'Strong close', met: true });
    score += 15;
  }

  return score;
}

function scoreVolumeClimax(candles: Candle[], volumeRatio: number, conditions: ConditionCheck[]): number {
  let score = 0;
  const latest = candles[candles.length - 1];

  // Extreme volume
  if (volumeRatio > 3.0) {
    conditions.push({ id: 'volume', label: 'Climax volume', met: true, value: `${volumeRatio.toFixed(2)}x` });
    score += 40;
  } else {
    conditions.push({ id: 'volume', label: 'Volume not extreme', met: false });
  }

  // Exhaustion candle
  const body = Math.abs(latest.close - latest.open);
  const totalRange = latest.high - latest.low;
  const hasLongWick = (latest.high - Math.max(latest.open, latest.close)) > body * 1.5 ||
                      (Math.min(latest.open, latest.close) - latest.low) > body * 1.5;
  
  if (hasLongWick) {
    conditions.push({ id: 'exhaustion', label: 'Exhaustion candle', met: true });
    score += 30;
  } else {
    conditions.push({ id: 'exhaustion', label: 'No exhaustion', met: false });
  }

  // Immediate reversal
  const prev = candles[candles.length - 2];
  const reversed = (prev.close < prev.open && latest.close > latest.open) || 
                   (prev.close > prev.open && latest.close < latest.open);
  if (reversed) {
    conditions.push({ id: 'reversal', label: 'Immediate reversal', met: true });
    score += 20;
  }

  return score;
}

function scoreInstitutionalBreaker(candles: Candle[], conditions: ConditionCheck[]): number {
  let score = 0;

  // Structure break (new high/low)
  const highs = candles.slice(-20, -1).map(c => c.high);
  const lows = candles.slice(-20, -1).map(c => c.low);
  const latest = candles[candles.length - 1];
  
  if (latest.close > Math.max(...highs)) {
    conditions.push({ id: 'break', label: 'Upside structure break', met: true });
    score += 35;
  } else if (latest.close < Math.min(...lows)) {
    conditions.push({ id: 'break', label: 'Downside structure break', met: true });
    score += 35;
  } else {
    conditions.push({ id: 'break', label: 'No structure break', met: false });
  }

  // Mark breaker candle
  conditions.push({ id: 'breaker', label: 'Breaker block marked', met: true });
  score += 20;

  // Retest setup
  const distanceFromBreak = Math.abs(latest.close - Math.max(...highs)) / latest.close;
  if (distanceFromBreak < 0.015) {
    conditions.push({ id: 'retest', label: 'Retest zone active', met: true });
    score += 25;
  } else {
    conditions.push({ id: 'retest', label: 'Awaiting retest', met: false });
  }

  return score;
}

function scoreInstitutionalMitigation(candles: Candle[], conditions: ConditionCheck[]): number {
  let score = 0;

  // Identify mitigation zone (last opposite candle before move)
  const latest = candles[candles.length - 1];
  let mitigationFound = false;
  
  for (let i = candles.length - 2; i >= Math.max(0, candles.length - 10); i--) {
    const c = candles[i];
    if ((latest.close > latest.open && c.close < c.open) || 
        (latest.close < latest.open && c.close > c.open)) {
      mitigationFound = true;
      break;
    }
  }

  if (mitigationFound) {
    conditions.push({ id: 'zone', label: 'Mitigation zone identified', met: true });
    score += 35;
  } else {
    conditions.push({ id: 'zone', label: 'No mitigation zone', met: false });
  }

  // Price returning
  conditions.push({ id: 'return', label: 'Price approaching zone', met: true });
  score += 25;

  // Absorption
  const body = Math.abs(latest.close - latest.open);
  const totalRange = latest.high - latest.low;
  if (totalRange > body * 1.5) {
    conditions.push({ id: 'absorption', label: 'Absorption detected', met: true });
    score += 20;
  }

  return score;
}

function scoreInstitutionalVWAP(candles: Candle[], conditions: ConditionCheck[]): number {
  let score = 0;

  // Calculate VWAP approximation (volume-weighted average)
  let sumPriceVolume = 0;
  let sumVolume = 0;
  for (const c of candles.slice(-20)) {
    const typical = (c.high + c.low + c.close) / 3;
    sumPriceVolume += typical * c.volume;
    sumVolume += c.volume;
  }
  const vwap = sumVolume > 0 ? sumPriceVolume / sumVolume : 0;
  
  const latest = candles[candles.length - 1];
  const distanceFromVWAP = Math.abs(latest.close - vwap) / latest.close;

  // Far from VWAP
  if (distanceFromVWAP > 0.02) {
    conditions.push({ id: 'distance', label: 'Far from VWAP', met: true, value: `${(distanceFromVWAP * 100).toFixed(2)}%` });
    score += 30;
  } else {
    conditions.push({ id: 'distance', label: 'Near VWAP', met: false });
  }

  // Volume reducing
  const volumes = candles.slice(-10).map(c => c.volume);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  if (latest.volume < avgVolume * 0.8) {
    conditions.push({ id: 'volume', label: 'Volume reducing', met: true });
    score += 25;
  } else {
    conditions.push({ id: 'volume', label: 'Volume normal', met: false });
  }

  // Exhaustion signs
  const pinBar = isPinBar(latest);
  if (pinBar) {
    conditions.push({ id: 'exhaustion', label: 'Exhaustion pattern', met: true });
    score += 25;
  } else {
    conditions.push({ id: 'exhaustion', label: 'No exhaustion', met: false });
  }

  return score;
}

// Helper: Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];
  
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;
  
  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  
  // Subsequent RSI values
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  }
  
  return rsi;
}

// Helper: Calculate ATR
function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) return [];
  
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);
  }
  
  const atr: number[] = [];
  let sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
  atr.push(sum / period);
  
  for (let i = period; i < tr.length; i++) {
    const currentATR = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(currentATR);
  }
  
  return atr;
}

function generateNarrative(modality: StrategyModality, conditions: ConditionCheck[], score: number): string {
  const metConditions = conditions.filter(c => c.met);
  const totalConditions = conditions.length;
  
  if (score < 30) {
    return `Low opportunity score (${score}/100). Only ${metConditions.length}/${totalConditions} conditions met. Wait for better setup.`;
  }
  
  if (score < 60) {
    return `Moderate opportunity (${score}/100). ${metConditions.length}/${totalConditions} conditions met. Consider entry with reduced position size.`;
  }
  
  if (score < 80) {
    return `Good opportunity (${score}/100). ${metConditions.length}/${totalConditions} conditions met. Strong setup for ${getModalityLabel(modality)} strategy.`;
  }
  
  return `Excellent opportunity (${score}/100). ${metConditions.length}/${totalConditions} conditions met. High-probability ${getModalityLabel(modality)} setup.`;
}

function getModalityLabel(modality: StrategyModality): string {
  const info = STRATEGY_MODALITIES.find(m => m.id === modality);
  return info ? info.label : modality;
}
