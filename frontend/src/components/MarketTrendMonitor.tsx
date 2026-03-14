import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Zap } from 'lucide-react';
import { useMarketMultiIntervalCandles } from '@/hooks/useMarketMultiIntervalCandles';
import { detectUnifiedMarketTurn, getTurnEventKey, type MarketTurn } from '@/lib/marketTurnDetection';
import { toast } from 'sonner';

interface MarketTrendMonitorProps {
  symbol: string;
}

export default function MarketTrendMonitor({ symbol }: MarketTrendMonitorProps) {
  const { intervals, hasAnyData, allLoading, hasErrors } = useMarketMultiIntervalCandles(symbol, 100);
  const lastTurnKeyRef = useRef<string>('');

  // Analyze all intervals and pick the best turn signal
  const bestTurn = intervals.reduce<{ turn: MarketTurn | null; ema20: number | null; ema50: number | null; interval: string | null }>((best, intervalData) => {
    if (!intervalData.candles || intervalData.candles.length === 0) {
      return best;
    }

    const result = detectUnifiedMarketTurn(intervalData.candles, intervalData.interval);
    
    if (result.turn.detected && (!best.turn || result.turn.confidence > best.turn.confidence)) {
      return {
        turn: result.turn,
        ema20: result.ema20,
        ema50: result.ema50,
        interval: intervalData.interval,
      };
    }

    return best;
  }, { turn: null, ema20: null, ema50: null, interval: null });

  // Trigger toast notification on new turn
  useEffect(() => {
    if (!bestTurn.turn || !bestTurn.turn.detected) {
      return;
    }

    const currentTurnKey = getTurnEventKey(symbol, bestTurn.turn);
    
    if (currentTurnKey && currentTurnKey !== lastTurnKeyRef.current) {
      lastTurnKeyRef.current = currentTurnKey;
      
      const turnDate = bestTurn.turn.timestamp ? new Date(bestTurn.turn.timestamp) : new Date();
      const turnTime = turnDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const typeLabel = bestTurn.turn.type === 'major' ? 'Major' : 'Micro';
      const directionLabel = bestTurn.turn.direction === 'upward' ? '↑' : '↓';

      toast.success(`Market Turn Detected: ${symbol}`, {
        description: `${typeLabel} ${directionLabel} turn on ${bestTurn.turn.interval} at ${turnTime}`,
        duration: 8000,
      });
    }
  }, [bestTurn.turn?.detected, bestTurn.turn?.timestamp, bestTurn.turn?.type, bestTurn.turn?.direction, symbol, bestTurn.turn?.interval]);

  if (allLoading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Market Turn Monitor</CardTitle>
          <CardDescription>Loading market data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Activity className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyData && hasErrors) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Market Turn Monitor</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load market data. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyData) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Market Turn Monitor</CardTitle>
          <CardDescription>Insufficient data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Not enough candle data to detect market turns. Please wait for data to load.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getTurnStatusColor = (detected: boolean, direction: string | null): string => {
    if (!detected) return 'text-zinc-400';
    return direction === 'upward' ? 'text-green-500' : 'text-red-500';
  };

  const getTurnIcon = (detected: boolean, direction: string | null) => {
    if (!detected) return <Activity className="w-6 h-6" />;
    return direction === 'upward' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />;
  };

  const getTurnBadgeVariant = (detected: boolean, direction: string | null): "default" | "destructive" | "outline" | "secondary" => {
    if (!detected) return 'outline';
    return direction === 'upward' ? 'default' : 'destructive';
  };

  const statusText = bestTurn.turn?.detected 
    ? `Turn Detected (${bestTurn.turn.direction === 'upward' ? 'Upward' : 'Downward'})`
    : 'No Turn Detected';

  return (
    <div className="space-y-6">
      {/* Current Turn Status */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-3">
            <span className={getTurnStatusColor(bestTurn.turn?.detected || false, bestTurn.turn?.direction || null)}>
              {getTurnIcon(bestTurn.turn?.detected || false, bestTurn.turn?.direction || null)}
            </span>
            Market Turn Monitor
          </CardTitle>
          <CardDescription>Real-time detection of major reversals and micro-turns for {symbol}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Turn Status */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Current Status</p>
              <p className={`text-3xl font-bold ${getTurnStatusColor(bestTurn.turn?.detected || false, bestTurn.turn?.direction || null)}`}>
                {statusText}
              </p>
            </div>
            <Badge variant={getTurnBadgeVariant(bestTurn.turn?.detected || false, bestTurn.turn?.direction || null)} className="text-lg px-4 py-2">
              {bestTurn.turn?.detected ? (bestTurn.turn.direction === 'upward' ? '↑ Upward' : '↓ Downward') : 'Monitoring'}
            </Badge>
          </div>

          {/* Turn Details */}
          {bestTurn.turn?.detected ? (
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Detected Turn</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {bestTurn.turn.type === 'major' ? 'Major Reversal' : 'Micro Turn'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {bestTurn.turn.interval}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {bestTurn.turn.direction === 'upward' ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="text-lg font-semibold text-zinc-100">
                    {bestTurn.turn.direction === 'upward' ? 'Upward Turn' : 'Downward Turn'}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {bestTurn.turn.reason}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Confidence</p>
                  <p className="text-sm font-semibold text-amber-500">
                    {(bestTurn.turn.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              {bestTurn.turn.timestamp && (
                <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                  Detected at {new Date(bestTurn.turn.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No turn detected in the current market conditions. Continue monitoring for reversal signals.
              </AlertDescription>
            </Alert>
          )}

          {/* EMA Indicators (if available) */}
          {bestTurn.ema20 !== null && bestTurn.ema50 !== null && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                <p className="text-xs text-zinc-400 mb-1">EMA 20</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {bestTurn.ema20.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                <p className="text-xs text-zinc-400 mb-1">EMA 50</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {bestTurn.ema50.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Multi-Interval Status */}
          <div className="pt-4 border-t border-zinc-700">
            <p className="text-xs text-zinc-400 mb-3">Monitoring Intervals</p>
            <div className="grid grid-cols-3 gap-2">
              {intervals.map((intervalData) => (
                <div
                  key={intervalData.interval}
                  className={`p-2 rounded border text-center ${
                    intervalData.candles && intervalData.candles.length > 0
                      ? 'bg-zinc-800/50 border-zinc-700'
                      : 'bg-zinc-900/30 border-zinc-800'
                  }`}
                >
                  <p className="text-xs font-semibold text-zinc-300">{intervalData.interval}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {intervalData.isLoading ? 'Loading...' : intervalData.error ? 'Error' : intervalData.candles ? `${intervalData.candles.length} candles` : 'No data'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method/Rules Section */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">Detection Method</CardTitle>
          <CardDescription>How market turns are identified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <div>
            <h4 className="font-semibold text-zinc-100 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Unified Turn Detection
            </h4>
            <p className="text-zinc-400 leading-relaxed">
              The system monitors multiple timeframes (3m, 15m, 1h) simultaneously and detects both major regime 
              reversals and micro-turns using a combination of technical indicators and price action patterns.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-zinc-100">Major Reversals</p>
                <p className="text-zinc-400">
                  EMA20/EMA50 crossovers with 2-candle confirmation. High confidence (85%) signals for significant trend changes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-zinc-100">Micro Turns</p>
                <p className="text-zinc-400">
                  Reversal patterns (engulfing, hammer, shooting star), exhaustion signals at support/resistance. 
                  Medium confidence (70%) for short-term reversals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-zinc-100">Multi-Interval Analysis</p>
                <p className="text-zinc-400">
                  Analyzes 3m, 15m, and 1h timeframes. Prioritizes higher-confidence signals and adapts to available data.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 leading-relaxed">
              <strong>Note:</strong> All turn timestamps represent closed candle data only. The system automatically 
              selects the highest-confidence turn signal across all monitored intervals for reliable, deterministic results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
