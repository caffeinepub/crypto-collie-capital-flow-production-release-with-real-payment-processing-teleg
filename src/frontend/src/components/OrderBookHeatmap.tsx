import { useState } from 'react';
import { useBinanceOrderBookDepth } from '@/hooks/useBinanceOrderBookDepth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Layers, Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  calculateDepthMetrics,
  calculateCumulativeDepth,
  detectLiquidityWalls,
  getNormalizationMax,
} from '@/lib/orderBookDepthMetrics';

interface OrderBookHeatmapProps {
  symbol: string;
}

export default function OrderBookHeatmap({ symbol }: OrderBookHeatmapProps) {
  const [depthLimit, setDepthLimit] = useState(50);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [showLiquidityWalls, setShowLiquidityWalls] = useState(false);
  const [wallThreshold, setWallThreshold] = useState(50);

  const { data, isLoading, error } = useBinanceOrderBookDepth(symbol, depthLimit, refreshInterval);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Order Book Deep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to load order book data'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Order Book Deep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.bids.length === 0 && data.asks.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Order Book Deep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No order book data available</p>
        </CardContent>
      </Card>
    );
  }

  const displayLimit = Math.min(depthLimit, Math.min(data.bids.length, data.asks.length));
  const metrics = calculateDepthMetrics(data.bids, data.asks, displayLimit);

  const displayBids = data.bids.slice(0, displayLimit);
  const displayAsks = data.asks.slice(0, displayLimit);

  const cumulativeBids = calculateCumulativeDepth(displayBids);
  const cumulativeAsks = calculateCumulativeDepth(displayAsks);
  const normalizationMax = getNormalizationMax(cumulativeBids, cumulativeAsks);

  const liquidityWalls = showLiquidityWalls
    ? detectLiquidityWalls(displayBids, displayAsks, wallThreshold)
    : [];

  const isLiquidityWall = (price: number, isBid: boolean): boolean => {
    return liquidityWalls.some((w) => w.price === price && w.isBid === isBid);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatQuantity = (qty: number) => {
    if (qty >= 1000) return `${(qty / 1000).toFixed(2)}K`;
    return qty.toFixed(2);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Order Book Deep - {symbol}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time depth analysis with cumulative liquidity visualization
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="depth-limit" className="text-xs font-medium flex items-center gap-1">
              <Settings2 className="w-3 h-3" />
              Depth Limit
            </Label>
            <Select value={depthLimit.toString()} onValueChange={(v) => setDepthLimit(Number(v))}>
              <SelectTrigger id="depth-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 levels</SelectItem>
                <SelectItem value="50">50 levels</SelectItem>
                <SelectItem value="100">100 levels</SelectItem>
                <SelectItem value="500">500 levels</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refresh-interval" className="text-xs font-medium">
              Refresh Interval
            </Label>
            <Select
              value={refreshInterval.toString()}
              onValueChange={(v) => setRefreshInterval(Number(v))}
            >
              <SelectTrigger id="refresh-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1 second</SelectItem>
                <SelectItem value="2000">2 seconds</SelectItem>
                <SelectItem value="5000">5 seconds</SelectItem>
                <SelectItem value="10000">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="liquidity-walls" className="text-xs font-medium">
              Liquidity Walls
            </Label>
            <div className="flex items-center space-x-2 h-10">
              <Switch
                id="liquidity-walls"
                checked={showLiquidityWalls}
                onCheckedChange={setShowLiquidityWalls}
              />
              <span className="text-sm text-muted-foreground">
                {showLiquidityWalls ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {showLiquidityWalls && (
            <div className="space-y-2">
              <Label htmlFor="wall-threshold" className="text-xs font-medium">
                Wall Threshold: {wallThreshold}%
              </Label>
              <Slider
                id="wall-threshold"
                min={30}
                max={80}
                step={5}
                value={[wallThreshold]}
                onValueChange={(v) => setWallThreshold(v[0])}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Best Bid</p>
              <p className="text-sm font-mono font-semibold text-green-500">
                {formatPrice(metrics.bestBid)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Best Ask</p>
              <p className="text-sm font-mono font-semibold text-red-500">
                {formatPrice(metrics.bestAsk)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Mid Price</p>
              <p className="text-sm font-mono font-semibold">{formatPrice(metrics.midPrice)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Spread</p>
              <p className="text-sm font-mono font-semibold">
                {formatPrice(metrics.spreadAbsolute)} ({formatNumber(metrics.spreadPercent, 3)}%)
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Bid Depth</p>
              <p className="text-sm font-mono font-semibold text-green-500">
                {formatQuantity(metrics.bidDepthTotal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ask Depth</p>
              <p className="text-sm font-mono font-semibold text-red-500">
                {formatQuantity(metrics.askDepthTotal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Imbalance</p>
              <p
                className={`text-sm font-mono font-semibold ${
                  metrics.depthImbalance > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatNumber(metrics.depthImbalancePercent, 1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Direction</p>
              <p
                className={`text-sm font-semibold ${
                  metrics.depthImbalance > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {metrics.depthImbalance > 0 ? 'Bid Heavy' : 'Ask Heavy'}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Depth View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bids Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-green-500 flex items-center gap-2">
              Bids (Buy Orders)
              <span className="text-xs text-muted-foreground font-normal">
                {cumulativeBids.length} levels
              </span>
            </h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {cumulativeBids.map((bid, idx) => {
                const barWidth = normalizationMax > 0 ? (bid.cumulative / normalizationMax) * 100 : 0;
                const isWall = isLiquidityWall(bid.price, true);
                return (
                  <div
                    key={`bid-${idx}`}
                    className={`relative flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                      isWall ? 'ring-2 ring-green-400' : ''
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-green-500/20 rounded"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative z-10 font-mono text-green-400 font-semibold">
                      {formatPrice(bid.price)}
                    </span>
                    <div className="relative z-10 flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">
                        {formatQuantity(bid.quantity)}
                      </span>
                      <span className="text-green-400 text-xs font-mono">
                        Σ {formatQuantity(bid.cumulative)}
                      </span>
                      {isWall && (
                        <span className="text-xs font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">
                          WALL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asks Column */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2">
              Asks (Sell Orders)
              <span className="text-xs text-muted-foreground font-normal">
                {cumulativeAsks.length} levels
              </span>
            </h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {cumulativeAsks.map((ask, idx) => {
                const barWidth = normalizationMax > 0 ? (ask.cumulative / normalizationMax) * 100 : 0;
                const isWall = isLiquidityWall(ask.price, false);
                return (
                  <div
                    key={`ask-${idx}`}
                    className={`relative flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                      isWall ? 'ring-2 ring-red-400' : ''
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-red-500/20 rounded"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative z-10 font-mono text-red-400 font-semibold">
                      {formatPrice(ask.price)}
                    </span>
                    <div className="relative z-10 flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">
                        {formatQuantity(ask.quantity)}
                      </span>
                      <span className="text-red-400 text-xs font-mono">
                        Σ {formatQuantity(ask.cumulative)}
                      </span>
                      {isWall && (
                        <span className="text-xs font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">
                          WALL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
