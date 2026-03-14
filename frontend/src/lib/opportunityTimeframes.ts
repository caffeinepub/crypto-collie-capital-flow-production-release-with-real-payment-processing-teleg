// Opportunity Recognition timeframe options and defaults

export interface TimeframeOption {
  id: string;
  label: string;
  binanceInterval: string;
  description: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  {
    id: 'short',
    label: '3m (Short)',
    binanceInterval: '3m',
    description: 'Scalping & Day Trade - High frequency signals',
  },
  {
    id: 'medium',
    label: '15m (Medium)',
    binanceInterval: '15m',
    description: 'Day Trade & Swing - Intraday movements',
  },
  {
    id: 'higher',
    label: '1h (Higher)',
    binanceInterval: '1h',
    description: 'Swing & Position - Broader confirmation',
  },
];

export const DEFAULT_TIMEFRAMES = ['short', 'medium'];

export function getTimeframeById(id: string): TimeframeOption | undefined {
  return TIMEFRAME_OPTIONS.find(tf => tf.id === id);
}

export function getBinanceIntervals(timeframeIds: string[]): string[] {
  return timeframeIds
    .map(id => getTimeframeById(id))
    .filter((tf): tf is TimeframeOption => tf !== undefined)
    .map(tf => tf.binanceInterval);
}
