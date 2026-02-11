import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, Clock, AlertCircle, Zap, Eye, EyeOff, Brain } from 'lucide-react';
import { useAssetChartData } from '@/hooks/useQueries';

interface AdvancedAssetChartProps {
  symbol: string;
}

type TimeFrame = '1h' | '4h' | '24h';

export default function AdvancedAssetChart({ symbol }: AdvancedAssetChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('4h');
  const [showRSI, setShowRSI] = useState(true);
  const [showOI, setShowOI] = useState(true);
  const [showConfluence, setShowConfluence] = useState(true);
  const [showPredictive, setShowPredictive] = useState(true);

  const { data: chartData, isLoading, error } = useAssetChartData(symbol, timeFrame);

  // Calculate current metrics with predictive intelligence
  const currentMetrics = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return null;
    }
    
    const latest = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : latest;
    
    // Detect confluence: RSI between 40-60, OI increasing, price rising
    const hasConfluence = 
      latest.rsi >= 40 && 
      latest.rsi <= 60 && 
      latest.oiChange > 0 && 
      latest.close > previous.close;
    
    // Calculate confluence score (0-100)
    const rsiScore = latest.rsi >= 40 && latest.rsi <= 60 ? 30 : 0;
    const oiScore = latest.oiChange > 0 ? 30 : 0;
    const priceScore = latest.close > previous.close ? 40 : 0;
    const confluenceScore = rsiScore + oiScore + priceScore;
    
    // Predictive intelligence
    const reversalProbability = latest.reversalProbability || 0;
    const predictiveConfidence = latest.predictiveConfidence || 0;
    
    return {
      price: latest.close,
      rsi: latest.rsi,
      openInterest: latest.openInterest,
      volume: latest.volume,
      confluence: confluenceScore,
      hasConfluence,
      priceChange: ((latest.close - previous.close) / previous.close) * 100,
      oiChange: latest.oiChange,
      reversalProbability,
      predictiveConfidence,
    };
  }, [chartData]);

  // Enhanced chart data with confluence detection and predictive intelligence
  const enhancedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    return chartData.map((point, index) => {
      const previous = index > 0 ? chartData[index - 1] : point;
      
      // Detect confluence for this point
      const hasConfluence = 
        point.rsi >= 40 && 
        point.rsi <= 60 && 
        point.oiChange > 0 && 
        point.close > previous.close;
      
      // Calculate volume flow direction
      const volumeColor = point.close > previous.close ? '#10b981' : '#ef4444';
      
      // Predictive zone detection
      const isPredictiveZone = (point.reversalProbability || 0) > 0.5;
      
      return {
        ...point,
        hasConfluence,
        volumeColor,
        confluenceGlow: hasConfluence ? 1 : 0,
        isPredictiveZone,
      };
    });
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900/95 border border-cyan-500/30 rounded-lg p-4 shadow-lg backdrop-blur-md">
          <p className="text-gray-300 text-sm font-semibold mb-3">{label}</p>
          
          {/* Price Data */}
          <div className="space-y-2 mb-3 pb-3 border-b border-gray-700">
            <div className="text-xs font-semibold text-cyan-400 mb-1">PREÇO</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Abertura:</span>
                <span className="text-cyan-400 font-semibold">{data.open?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Máxima:</span>
                <span className="text-green-400 font-semibold">{data.high?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mínima:</span>
                <span className="text-red-400 font-semibold">{data.low?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fechamento:</span>
                <span className="text-white font-semibold">{data.close?.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* RSI */}
          {showRSI && (
            <div className="space-y-1 mb-3 pb-3 border-b border-gray-700">
              <div className="text-xs font-semibold text-purple-400 mb-1">RSI</div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-gray-400">Valor:</span>
                <span className={`font-semibold ${
                  data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-purple-400'
                }`}>
                  {data.rsi?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${
                  data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {data.rsi > 70 ? 'Sobrecomprado' : data.rsi < 30 ? 'Sobrevendido' : 'Neutro'}
                </span>
              </div>
            </div>
          )}
          
          {/* Open Interest */}
          {showOI && (
            <div className="space-y-1 mb-3 pb-3 border-b border-gray-700">
              <div className="text-xs font-semibold text-orange-400 mb-1">OPEN INTEREST</div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-gray-400">Valor:</span>
                <span className="text-orange-400 font-semibold">{(data.openInterest / 1e6).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-gray-400">Variação:</span>
                <span className={`font-semibold ${
                  data.oiChange > 0 ? 'text-green-400' : data.oiChange < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {data.oiChange > 0 ? '+' : ''}{data.oiChange?.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Volume */}
          <div className="space-y-1 mb-3 pb-3 border-b border-gray-700">
            <div className="text-xs font-semibold text-blue-400 mb-1">VOLUME</div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-gray-400">Valor:</span>
              <span className="text-blue-400 font-semibold">{(data.volume / 1e6).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-gray-400">Fluxo:</span>
              <span className={`font-semibold ${data.volumeColor === '#10b981' ? 'text-green-400' : 'text-red-400'}`}>
                {data.volumeColor === '#10b981' ? 'Entrada (USD → Cripto)' : 'Saída (Cripto → USD)'}
              </span>
            </div>
          </div>
          
          {/* Predictive Intelligence */}
          {showPredictive && data.reversalProbability !== undefined && (
            <div className="space-y-1 mb-3 pb-3 border-b border-gray-700">
              <div className="text-xs font-semibold text-purple-400 mb-1 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                INTELIGÊNCIA PREDITIVA
              </div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-gray-400">Reversão Provável:</span>
                <span className={`font-semibold ${
                  data.reversalProbability > 0.6 ? 'text-orange-400' : 'text-gray-400'
                }`}>
                  {(data.reversalProbability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-gray-400">Confiança:</span>
                <span className="text-purple-400 font-semibold">
                  {(data.predictiveConfidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Confluence */}
          {showConfluence && data.hasConfluence && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                CONFLUÊNCIA DETECTADA
              </div>
              <div className="text-xs text-yellow-300">
                Setup de alta: RSI neutro + OI crescente + Preço subindo
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/80 border-cyan-500/20 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-8 w-48 bg-gray-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-24 bg-gray-700" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-zinc-900/80 border-red-500/20 backdrop-blur-md">
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-red-400 font-semibold">Erro ao carregar dados do gráfico</p>
            <p className="text-gray-400 text-sm">
              {error instanceof Error ? error.message : 'Dados indisponíveis'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-zinc-900/80 border-cyan-500/20 backdrop-blur-md">
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto" />
            <p className="text-gray-400">Nenhum dado disponível para este período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time Metrics Panel with Predictive Intelligence */}
      {currentMetrics && (
        <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Métricas em Tempo Real
              <Badge variant="outline" className="ml-2 border-purple-500/50 text-purple-400">
                <Brain className="w-3 h-3 mr-1" />
                Collie Predict Intel
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Price */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Preço</div>
                <div className="text-xl font-bold text-white">
                  ${currentMetrics.price.toFixed(2)}
                </div>
                <div className={`text-xs flex items-center gap-1 ${
                  currentMetrics.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentMetrics.priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {currentMetrics.priceChange >= 0 ? '+' : ''}{currentMetrics.priceChange.toFixed(2)}%
                </div>
              </div>
              
              {/* RSI */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">RSI</div>
                <div className={`text-xl font-bold ${
                  currentMetrics.rsi > 70 ? 'text-red-400' : currentMetrics.rsi < 30 ? 'text-green-400' : 'text-purple-400'
                }`}>
                  {currentMetrics.rsi.toFixed(1)}
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    currentMetrics.rsi > 70 
                      ? 'border-red-500/50 text-red-400' 
                      : currentMetrics.rsi < 30 
                      ? 'border-green-500/50 text-green-400' 
                      : 'border-purple-500/50 text-purple-400'
                  }`}
                >
                  {currentMetrics.rsi > 70 ? 'Sobrecomprado' : currentMetrics.rsi < 30 ? 'Sobrevendido' : 'Neutro'}
                </Badge>
              </div>
              
              {/* Open Interest */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Open Interest</div>
                <div className="text-xl font-bold text-orange-400">
                  {(currentMetrics.openInterest / 1e6).toFixed(1)}M
                </div>
                <div className={`text-xs ${
                  currentMetrics.oiChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentMetrics.oiChange > 0 ? '+' : ''}{currentMetrics.oiChange.toFixed(2)}%
                </div>
              </div>
              
              {/* Volume */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Volume</div>
                <div className="text-xl font-bold text-blue-400">
                  {(currentMetrics.volume / 1e6).toFixed(1)}M
                </div>
                <div className={`text-xs ${
                  currentMetrics.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentMetrics.priceChange >= 0 ? 'Entrada' : 'Saída'}
                </div>
              </div>
              
              {/* Reversal Probability */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Reversão Provável
                </div>
                <div className={`text-xl font-bold ${
                  currentMetrics.reversalProbability > 0.6 ? 'text-orange-400' : 'text-gray-500'
                }`}>
                  {(currentMetrics.reversalProbability * 100).toFixed(0)}%
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    currentMetrics.reversalProbability > 0.6 
                      ? 'border-orange-500/50 text-orange-400' 
                      : 'border-gray-500/50 text-gray-400'
                  }`}
                >
                  {currentMetrics.reversalProbability > 0.6 ? 'Alta' : 'Baixa'}
                </Badge>
              </div>
              
              {/* Confluence */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Confluência</div>
                <div className={`text-xl font-bold ${
                  currentMetrics.hasConfluence ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  {currentMetrics.confluence}%
                </div>
                {currentMetrics.hasConfluence && (
                  <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                    <Zap className="w-3 h-3 mr-1" />
                    Setup de Alta
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chart */}
      <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Gráfico Multi-Camadas - {symbol}
            </CardTitle>
            
            {/* Timeframe Selector */}
            <div className="flex gap-1 bg-black/30 rounded-lg p-1">
              <Button
                size="sm"
                variant={timeFrame === '1h' ? 'default' : 'ghost'}
                onClick={() => setTimeFrame('1h')}
                className={`${
                  timeFrame === '1h'
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Clock className="w-3 h-3 mr-1" />
                1h
              </Button>
              <Button
                size="sm"
                variant={timeFrame === '4h' ? 'default' : 'ghost'}
                onClick={() => setTimeFrame('4h')}
                className={`${
                  timeFrame === '4h'
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Clock className="w-3 h-3 mr-1" />
                4h
              </Button>
              <Button
                size="sm"
                variant={timeFrame === '24h' ? 'default' : 'ghost'}
                onClick={() => setTimeFrame('24h')}
                className={`${
                  timeFrame === '24h'
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Clock className="w-3 h-3 mr-1" />
                24h
              </Button>
            </div>
          </div>
          
          {/* Layer Controls */}
          <div className="flex flex-wrap gap-4 mt-4 p-4 bg-black/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="rsi-toggle"
                checked={showRSI}
                onCheckedChange={setShowRSI}
                className="data-[state=checked]:bg-purple-500"
              />
              <Label htmlFor="rsi-toggle" className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                {showRSI ? <Eye className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                RSI
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="oi-toggle"
                checked={showOI}
                onCheckedChange={setShowOI}
                className="data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="oi-toggle" className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                {showOI ? <Eye className="w-4 h-4 text-orange-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                Open Interest
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="confluence-toggle"
                checked={showConfluence}
                onCheckedChange={setShowConfluence}
                className="data-[state=checked]:bg-yellow-500"
              />
              <Label htmlFor="confluence-toggle" className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                {showConfluence ? <Eye className="w-4 h-4 text-yellow-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                Confluência
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="predictive-toggle"
                checked={showPredictive}
                onCheckedChange={setShowPredictive}
                className="data-[state=checked]:bg-purple-500"
              />
              <Label htmlFor="predictive-toggle" className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                {showPredictive ? <Brain className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                Inteligência Preditiva
              </Label>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={enhancedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {/* Price gradient */}
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                
                {/* RSI gradient with shaded area */}
                <linearGradient id="colorRSI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                </linearGradient>
                
                {/* OI gradient */}
                <linearGradient id="colorOI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                
                {/* Confluence glow effect */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={{ stroke: '#4b5563' }}
              />
              
              {/* Price Y-Axis (left) */}
              <YAxis 
                yAxisId="price"
                stroke="#10b981" 
                tick={{ fill: '#10b981', fontSize: 11 }}
                tickLine={{ stroke: '#10b981' }}
                domain={['auto', 'auto']}
              />
              
              {/* RSI Y-Axis (right) */}
              {showRSI && (
                <YAxis 
                  yAxisId="rsi"
                  orientation="right"
                  stroke="#a855f7" 
                  tick={{ fill: '#a855f7', fontSize: 11 }}
                  tickLine={{ stroke: '#a855f7' }}
                  domain={[0, 100]}
                  ticks={[0, 30, 50, 70, 100]}
                />
              )}
              
              {/* OI Y-Axis (right, offset) */}
              {showOI && (
                <YAxis 
                  yAxisId="oi"
                  orientation="right"
                  stroke="#f97316" 
                  tick={{ fill: '#f97316', fontSize: 11 }}
                  tickLine={{ stroke: '#f97316' }}
                  tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
                  dx={showRSI ? 50 : 0}
                />
              )}
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => <span className="text-gray-300 text-xs">{value}</span>}
              />
              
              {/* RSI Reference Lines */}
              {showRSI && (
                <>
                  <ReferenceLine 
                    yAxisId="rsi"
                    y={70} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5" 
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                  <ReferenceLine 
                    yAxisId="rsi"
                    y={30} 
                    stroke="#10b981" 
                    strokeDasharray="5 5" 
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                  <ReferenceLine 
                    yAxisId="rsi"
                    y={50} 
                    stroke="#6b7280" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                    opacity={0.3}
                  />
                </>
              )}
              
              {/* Predictive reversal zones */}
              {showPredictive && enhancedChartData.map((point, index) => {
                if (point.isPredictiveZone && index < enhancedChartData.length - 1) {
                  return (
                    <ReferenceArea
                      key={`predictive-${index}`}
                      yAxisId="price"
                      x1={point.time}
                      x2={enhancedChartData[index + 1].time}
                      fill="#a855f7"
                      fillOpacity={0.1}
                      stroke="#a855f7"
                      strokeOpacity={0.3}
                    />
                  );
                }
                return null;
              })}
              
              {/* Confluence glow areas */}
              {showConfluence && enhancedChartData.map((point, index) => {
                if (point.hasConfluence && index < enhancedChartData.length - 1) {
                  return (
                    <ReferenceArea
                      key={`confluence-${index}`}
                      yAxisId="price"
                      x1={point.time}
                      x2={enhancedChartData[index + 1].time}
                      fill="#fbbf24"
                      fillOpacity={0.15}
                      stroke="#fbbf24"
                      strokeOpacity={0.3}
                    />
                  );
                }
                return null;
              })}
              
              {/* Volume bars at base (with flow direction colors) */}
              <Bar
                yAxisId="price"
                dataKey="volume"
                fill="#3b82f6"
                opacity={0.3}
                name="Volume"
              />
              
              {/* Price line with area fill */}
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorPrice)"
                name="Preço (USDT)"
                dot={false}
                filter={showConfluence ? "url(#glow)" : undefined}
              />
              
              {/* RSI line with shaded area between 30-70 */}
              {showRSI && (
                <Area
                  yAxisId="rsi"
                  type="monotone"
                  dataKey="rsi"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#colorRSI)"
                  name="RSI"
                  dot={false}
                />
              )}
              
              {/* Open Interest line */}
              {showOI && (
                <Line
                  yAxisId="oi"
                  type="monotone"
                  dataKey="openInterest"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Open Interest"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
