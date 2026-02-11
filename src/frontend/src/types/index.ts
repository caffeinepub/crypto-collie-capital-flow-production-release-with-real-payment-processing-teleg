export interface Stablecoin {
  symbol: string;
  name: string;
  volume: number;
  marketCap: number;
  price: number;
}

export interface FlowMetrics {
  totalFlow: number;
  inflow: number;
  outflow: number;
  netFlow: number;
}

export interface StablecoinFlow {
  stablecoin: Stablecoin;
  destinationAsset: CryptoAsset;
  flowVolume: number;
  confluenceStrength: number;
}

export interface CapitalFlowDirection {
  segment: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  flowStrength: number;
  flowDirection: 'inflow' | 'outflow' | 'neutral';
  description: string;
}

export interface HourlyFlowActivity {
  hour: bigint;
  inflow: number;
  outflow: number;
  netFlow: number;
  flowStrength: number;
  description: string;
}

export interface ConfluenceTarget {
  asset: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  confluenceStrength: number;
  description: string;
}

export interface PredictiveFlow {
  asset: string;
  predictedDirection: 'inflow' | 'outflow' | 'neutral';
  predictedStrength: number;
  confidence: number;
  description: string;
}

export interface RSIData {
  value: number;
  trend: 'rising' | 'falling' | 'neutral';
  isEligible: boolean;
}

export interface OpenInterestData {
  current: number;
  previous: number;
  changePercent: number;
  isIncreasing: boolean;
}

export interface EarlyConfluence {
  shortIntervalSignal: boolean;
  rsiMomentum: boolean;
  volumeSpike: boolean;
  patternFormation: boolean;
  confluenceScore: number;
  institutionalVolume: boolean;
  signalStrength: string;
  projectedReversal: boolean;
  confluenceLabel: string;
  timingEstimate: number;
  probability: number;
  isEarlyConfirmed: boolean;
}

export interface InstitutionalSetup {
  hasLiquidity: boolean;
  hasManipulation: boolean;
  hasCHOCH: boolean;
  hasOb: boolean;
  hasFvg: boolean;
  hasMitigation: boolean;
  hasDisplacement: boolean;
  hasInstitutionalTarget: boolean;
  setupProgress: number;
  setupStatus: 'complete' | 'partial' | 'none';
  confluenceLevel: 'high' | 'medium' | 'low';
  setupNarrative?: string;
}

export interface InstitutionalCalibration {
  trendScore: number;
  supportScore: number;
  volumeTransactionScore: number;
  technicalIndicatorScore: number;
  shortPositionScore: number;
  wickRejectionScore: number;
  compositeScore: number;
  trendStatus: string;
  supportStatus: string;
  volumeTransactionStatus: string;
  technicalIndicatorStatus: string;
  shortPositionStatus: string;
  wickRejectionStatus: string;
  calibrationLevel: 'excellent' | 'good' | 'moderate' | 'weak';
  recommendation: string;
}

export type Region = 'usa' | 'asia' | 'europe' | 'brasil' | 'india' | 'arabia' | 'africa' | 'other';

export type RsiTrend = 'rising' | 'falling' | 'steady';

export type OpenInterestMomentum = 'increasing' | 'decreasing' | 'steady';

export type VolumeStrength = 'high' | 'medium' | 'low' | 'veryHigh' | 'extreme';

export interface CryptoAsset {
  name: string;
  symbol: string;
  volume: number;
  price: number;
  percentageChange: number;
  marketCap: number;
  volumeMarketCapRatio: number;
  description: string;
  momentum: number;
  volatility: number;
  correlation: number;
  confluenceScore: number;
  hasConfluence: boolean;
  region: Region;
  rsiValue: number;
  rsiTrend: RsiTrend;
  openInterest: number;
  openInterestMomentum: OpenInterestMomentum;
  volumeStrength: VolumeStrength;
  recommendationScore: number;
  hasStrongConfluence: boolean;
  rsiStatus: string;
  openInterestStatus: string;
  rsiSeries: number[];
  currentRsi: number;
}

export interface EnhancedCryptoAsset {
  name: string;
  symbol: string;
  volume: number;
  price: number;
  percentageChange: number;
  marketCap: number;
  volumeMarketCapRatio: number;
  description: string;
  momentum: number;
  volatility: number;
  correlation: number;
  confluenceScore: number;
  hasConfluence: boolean;
  region: Region;
  rsi?: RSIData;
  openInterest?: OpenInterestData;
  institutionalSetup?: InstitutionalSetup;
  earlyConfluence: EarlyConfluence;
  institutionalCalibration?: InstitutionalCalibration;
}

