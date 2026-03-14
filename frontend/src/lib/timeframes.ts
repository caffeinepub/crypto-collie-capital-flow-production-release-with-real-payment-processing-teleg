// Single source of truth for the 3-minute timeframe
export const THREE_MINUTE_TIMEFRAME = '3m' as const;
export const THREE_MINUTE_LABEL = 'Timeframe: 3m' as const;

export type Timeframe = typeof THREE_MINUTE_TIMEFRAME;
