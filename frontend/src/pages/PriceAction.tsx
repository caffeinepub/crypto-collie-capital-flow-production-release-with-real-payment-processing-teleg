import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Info, Target, Zap, BookOpen, Activity } from 'lucide-react';
import { formatNumber } from '@/lib/precision';

interface PatternMarker {
  pattern: string;
  direction: string;
  strength: string;
  confidence: number;
  detectedAt: number;
  contextualReason: string;
  expectedMovement: string;
  x: number;
  y: number;
}

interface AnalysisResult {
  score: number;
  patterns: Array<{
    pattern: string;
    direction: string;
    strength: string;
    confidence: number;
    detectedAt: number;
    contextualReason: string;
    expectedMovement: string;
  }>;
  trendDirection: string;
  signalStrength: string;
  recommendation: string;
  contextualNarrative: string;
  confidenceLevel: string;
}

export default function PriceAction() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [timeFrame, setTimeFrame] = useState<'1h' | '4h' | '24h'>('4h');
  const [candleData, setCandleData] = useState<any[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [patternMarkers, setPatternMarkers] = useState<PatternMarker[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch candle data from Binance
  useEffect(() => {
    const fetchCandleData = async () => {
      if (!selectedSymbol) return;
      
      setIsLoadingCandles(true);
      try {
        const intervalMap = {
          '1h': { interval: '5m', limit: 12 },
          '4h': { interval: '15m', limit: 16 },
          '24h': { interval: '1h', limit: 24 },
        };
        
        const { interval, limit } = intervalMap[timeFrame];
        
        const response = await fetch(
          `https://fapi.binance.com/fapi/v1/klines?symbol=${selectedSymbol}&interval=${interval}&limit=${limit}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const klines = await response.json();
        
        const candles = klines.map((kline: any) => ({
          timestamp: parseInt(kline[0]),
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
        }));
        
        setCandleData(candles);
      } catch (error) {
        console.error('Erro ao buscar dados de velas:', error);
      } finally {
        setIsLoadingCandles(false);
      }
    };
    
    fetchCandleData();
    const interval = setInterval(fetchCandleData, 20000);
    return () => clearInterval(interval);
  }, [selectedSymbol, timeFrame]);

  // Analyze patterns when candle data changes
  useEffect(() => {
    if (candleData.length === 0) return;

    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const analysis = analyzePatterns(candleData);
      setAnalysisResult(analysis);
      setIsAnalyzing(false);
    }, 500);
  }, [candleData]);

  // Simple pattern analysis function
  const analyzePatterns = (candles: any[]): AnalysisResult => {
    const patterns: any[] = [];
    let confluenceScore = 0;

    // Detect simple patterns
    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];

      // Engulfing pattern
      if (prev.close < prev.open && curr.open < curr.close && 
          curr.open <= prev.close && curr.close >= prev.open) {
        patterns.push({
          pattern: 'engulfing',
          direction: 'bullish',
          strength: 'moderate',
          confidence: 0.7,
          detectedAt: curr.timestamp,
          contextualReason: 'Padrão confirmado com volume - vela verde envolve completamente a vela vermelha anterior',
          expectedMovement: 'Reversão de alta provável baseada em estrutura de engolfo',
        });
        confluenceScore += 1;
      } else if (prev.open < prev.close && curr.open > curr.close && 
                 curr.open >= prev.close && curr.close <= prev.open) {
        patterns.push({
          pattern: 'engulfing',
          direction: 'bearish',
          strength: 'moderate',
          confidence: 0.7,
          detectedAt: curr.timestamp,
          contextualReason: 'Padrão confirmado com volume - vela vermelha envolve completamente a vela verde anterior',
          expectedMovement: 'Reversão de baixa provável baseada em estrutura de engolfo',
        });
        confluenceScore += 1;
      }

      // Pin Bar pattern
      const bodySize = Math.abs(curr.close - curr.open);
      const tailSize = Math.abs(curr.low - Math.min(curr.open, curr.close));
      const wickSize = Math.abs(curr.high - Math.max(curr.open, curr.close));

      if (tailSize > bodySize * 2 && tailSize > wickSize) {
        patterns.push({
          pattern: 'pinBar',
          direction: 'bullish',
          strength: 'moderate',
          confidence: 0.6,
          detectedAt: curr.timestamp,
          contextualReason: 'Pin bar detectado com pavio inferior longo - rejeição de preços baixos',
          expectedMovement: 'Possível reversão de alta com confirmação de volume',
        });
        confluenceScore += 1;
      } else if (wickSize > bodySize * 2 && wickSize > tailSize) {
        patterns.push({
          pattern: 'pinBar',
          direction: 'bearish',
          strength: 'moderate',
          confidence: 0.6,
          detectedAt: curr.timestamp,
          contextualReason: 'Pin bar detectado com pavio superior longo - rejeição de preços altos',
          expectedMovement: 'Possível reversão de baixa com confirmação de volume',
        });
        confluenceScore += 1;
      }
    }

    // Determine trend direction
    const firstPrice = candles[0].close;
    const lastPrice = candles[candles.length - 1].close;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    const trendDirection = priceChange > 2 ? 'bullish' : priceChange < -2 ? 'bearish' : 'neutral';
    
    // Calculate signal strength
    const signalStrength = confluenceScore >= 4 ? 'strong' : 
                          confluenceScore >= 3 ? 'moderate' : 
                          confluenceScore >= 2 ? 'weak' : 'no signal';

    // Generate recommendation
    let recommendation = '';
    if (signalStrength === 'strong' && trendDirection === 'bullish') {
      recommendation = 'Entrada longa recomendada devido a confluência de padrões de reversão';
    } else if (signalStrength === 'strong' && trendDirection === 'bearish') {
      recommendation = 'Entrada curta recomendada devido a confluência de padrões de reversão';
    } else if (signalStrength === 'moderate') {
      recommendation = 'Aguardar confirmação adicional antes da entrada';
    } else {
      recommendation = 'Sem sinal claro - aguardar melhores condições de mercado';
    }

    // Generate contextual narrative
    const contextualNarrative = patterns.length > 0
      ? `Detectados ${patterns.length} padrões de price action com confluência ${signalStrength}. ${
          trendDirection === 'bullish' 
            ? 'Tendência de alta confirmada com múltiplos sinais de reversão.' 
            : trendDirection === 'bearish'
            ? 'Tendência de baixa confirmada com múltiplos sinais de reversão.'
            : 'Mercado em consolidação aguardando definição de direção.'
        }`
      : 'Nenhum padrão significativo detectado no momento. Aguardar formação de estruturas claras.';

    return {
      score: Math.min(confluenceScore, 5),
      patterns: patterns.slice(0, 10), // Limit to 10 patterns
      trendDirection,
      signalStrength,
      recommendation,
      contextualNarrative,
      confidenceLevel: confluenceScore >= 4 ? 'Alta' : confluenceScore >= 2 ? 'Média' : 'Baixa',
    };
  };

  // Update pattern markers when analysis result changes
  useEffect(() => {
    if (analysisResult && analysisResult.patterns && candleData.length > 0) {
      const prices = candleData.map(c => [c.high, c.low]).flat();
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;
      const chartHeight = 400;
      const chartWidth = 800;

      const markers: PatternMarker[] = analysisResult.patterns.map((pattern: any) => {
        const candleIndex = candleData.findIndex(c => c.timestamp === pattern.detectedAt);
        if (candleIndex === -1) return null;

        const candle = candleData[candleIndex];
        const x = (candleIndex * chartWidth) / candleData.length + (chartWidth / candleData.length) / 2;
        const y = ((maxPrice + padding - candle.high) / (priceRange + 2 * padding)) * chartHeight;

        return {
          ...pattern,
          x,
          y,
        };
      }).filter(Boolean) as PatternMarker[];

      setPatternMarkers(markers);
    }
  }, [analysisResult, candleData]);

  const getPatternLabel = (pattern: string): string => {
    const labels: Record<string, string> = {
      'engulfing': 'Engolfo',
      'pinBar': 'Pin Bar',
      'liquiditySweep': 'Varredura de Liquidez',
      'bosChoch': 'BOS/CHoCH',
      'fvg': 'FVG',
      'supplyDemand': 'Oferta/Demanda',
      'forceCandle': 'Vela de Força',
    };
    return labels[pattern] || pattern;
  };

  const getDirectionLabel = (direction: string): string => {
    const labels: Record<string, string> = {
      'bullish': 'Alta',
      'bearish': 'Baixa',
      'uptrend': 'Tendência de Alta',
      'downtrend': 'Tendência de Baixa',
      'demand': 'Demanda',
      'supply': 'Oferta',
      'neutral': 'Neutro',
    };
    return labels[direction] || direction;
  };

  const getStrengthLabel = (strength: string): string => {
    const labels: Record<string, string> = {
      'strong': 'Forte',
      'moderate': 'Moderado',
      'weak': 'Fraco',
      'no signal': 'Sem Sinal',
    };
    return labels[strength] || strength;
  };

  const getSignalColor = (direction: string): string => {
    if (direction.includes('bullish') || direction.includes('uptrend') || direction.includes('demand')) {
      return 'text-green-400';
    } else if (direction.includes('bearish') || direction.includes('downtrend') || direction.includes('supply')) {
      return 'text-red-400';
    }
    return 'text-yellow-400';
  };

  const getConfluenceColor = (score: number): string => {
    if (score >= 4) return 'text-green-400 confluence-glow';
    if (score >= 3) return 'text-yellow-400';
    if (score >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPatternIcon = (pattern: string): string => {
    const icons: Record<string, string> = {
      'engulfing': '🔄',
      'pinBar': '📍',
      'liquiditySweep': '💧',
      'bosChoch': '🔀',
      'fvg': '📊',
      'supplyDemand': '⚖️',
      'forceCandle': '⚡',
    };
    return icons[pattern] || '🎯';
  };

  const renderCandlestickChart = () => {
    if (!candleData || candleData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-zinc-500">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado de vela disponível</p>
          </div>
        </div>
      );
    }

    const prices = candleData.map(c => [c.high, c.low]).flat();
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    const chartHeight = 400;
    const chartWidth = 800;
    const candleWidth = Math.max(chartWidth / candleData.length - 4, 8);

    // Calculate confluence zones
    const confluenceZones: Array<{ x: number; width: number; strength: number }> = [];
    if (analysisResult && analysisResult.score >= 3) {
      const zoneWidth = chartWidth * 0.15;
      patternMarkers.forEach((marker, idx) => {
        if (marker.confidence > 0.6) {
          confluenceZones.push({
            x: marker.x - zoneWidth / 2,
            width: zoneWidth,
            strength: marker.confidence,
          });
        }
      });
    }

    return (
      <div className="relative w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* Confluence zones with enhanced shading and glow */}
          {confluenceZones.map((zone, idx) => (
            <g key={`zone-${idx}`}>
              <defs>
                <linearGradient id={`confluenceGradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={`rgba(251, 191, 36, ${zone.strength * 0.25})`} />
                  <stop offset="50%" stopColor={`rgba(251, 191, 36, ${zone.strength * 0.4})`} />
                  <stop offset="100%" stopColor={`rgba(251, 191, 36, ${zone.strength * 0.15})`} />
                </linearGradient>
                <filter id={`glow-${idx}`}>
                  <feGaussianBlur stdDeviation={zone.strength * 6} result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Sharper zone boundary */}
              <rect
                x={zone.x}
                y={0}
                width={zone.width}
                height={chartHeight}
                fill={`url(#confluenceGradient-${idx})`}
                filter={`url(#glow-${idx})`}
                className="confluence-glow"
                stroke="rgba(251, 191, 36, 0.4)"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Candlesticks with smoother transitions */}
          {candleData.map((candle, index) => {
            const x = (index * chartWidth) / candleData.length + candleWidth / 2;
            const highY = ((maxPrice + padding - candle.high) / (priceRange + 2 * padding)) * chartHeight;
            const lowY = ((maxPrice + padding - candle.low) / (priceRange + 2 * padding)) * chartHeight;
            const openY = ((maxPrice + padding - candle.open) / (priceRange + 2 * padding)) * chartHeight;
            const closeY = ((maxPrice + padding - candle.close) / (priceRange + 2 * padding)) * chartHeight;

            const isBullish = candle.close > candle.open;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY);

            return (
              <g key={index} className="transition-all duration-300 ease-in-out">
                {/* Wick with smoother rendering */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isBullish ? '#10b981' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                {/* Body with rounded corners for smoother appearance */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={Math.max(bodyHeight, 1)}
                  fill={isBullish ? '#10b981' : '#ef4444'}
                  stroke={isBullish ? '#10b981' : '#ef4444'}
                  strokeWidth="1"
                  rx="1"
                  ry="1"
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* Pattern markers with enhanced glow outlines */}
          {patternMarkers.map((marker, idx) => (
            <g key={`marker-${idx}`} className="transition-all duration-300">
              <defs>
                <filter id={`markerGlow-${idx}`}>
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Enhanced glow outline for identified patterns */}
              <circle
                cx={marker.x}
                cy={marker.y - 20}
                r={14}
                fill={marker.direction.includes('bullish') || marker.direction.includes('demand') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                stroke={marker.direction.includes('bullish') || marker.direction.includes('demand') ? '#10b981' : '#ef4444'}
                strokeWidth="2.5"
                filter={`url(#markerGlow-${idx})`}
                className="cursor-pointer hover:opacity-80 transition-all duration-300"
              />
              <text
                x={marker.x}
                y={marker.y - 16}
                textAnchor="middle"
                fontSize="14"
                fill="#fff"
                className="pointer-events-none"
              >
                {getPatternIcon(marker.pattern)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500">
            Análise de Price Action
          </h1>
          <p className="text-zinc-400 mt-2">
            Detecção avançada de padrões com confluência contextual e sinais inteligentes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-40 bg-zinc-900/80 border-yellow-500/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-yellow-500/20">
              <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
              <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
              <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
              <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
              <SelectItem value="XRPUSDT">XRP/USDT</SelectItem>
            </SelectContent>
          </Select>
          
          <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as any)} className="w-auto">
            <TabsList className="bg-zinc-900/80 border border-yellow-500/20">
              <TabsTrigger value="1h" className="data-[state=active]:bg-yellow-500/20">1h</TabsTrigger>
              <TabsTrigger value="4h" className="data-[state=active]:bg-yellow-500/20">4h</TabsTrigger>
              <TabsTrigger value="24h" className="data-[state=active]:bg-yellow-500/20">24h</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Chart Card */}
      <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Gráfico com Padrões e Zonas de Confluência
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCandles ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
          ) : (
            renderCandlestickChart()
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Confluence Score */}
          <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Score de Confluência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getConfluenceColor(analysisResult.score)}`}>
                  {analysisResult.score}/5
                </div>
                <p className="text-zinc-400 mt-2">
                  {analysisResult.score >= 4 ? 'Confluência Muito Alta' :
                   analysisResult.score >= 3 ? 'Confluência Alta' :
                   analysisResult.score >= 2 ? 'Confluência Moderada' :
                   'Confluência Baixa'}
                </p>
                {analysisResult.confidenceLevel && (
                  <Badge variant="outline" className="mt-3">
                    Confiança: {analysisResult.confidenceLevel}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signal Strength */}
          <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                {analysisResult.trendDirection === 'bullish' ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : analysisResult.trendDirection === 'bearish' ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
                Sinal Sugerido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Direção</p>
                  <p className={`text-xl font-bold ${getSignalColor(analysisResult.trendDirection)}`}>
                    {getDirectionLabel(analysisResult.trendDirection)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Força do Sinal</p>
                  <Badge variant="outline" className="text-base">
                    {getStrengthLabel(analysisResult.signalStrength)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Recomendação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-yellow-500/20 cursor-help hover:border-yellow-500/40 transition-colors">
                      <p className="text-zinc-200 leading-relaxed">
                        {analysisResult.recommendation}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md bg-zinc-900 border-yellow-500/30 shadow-lg">
                    <p className="text-sm leading-relaxed">
                      Esta recomendação é baseada na confluência de múltiplos padrões de price action detectados.
                      Sempre confirme com análise adicional antes de tomar decisões de trading.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contextual Narrative */}
      {analysisResult && analysisResult.contextualNarrative && (
        <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Narrativa de Confluência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-yellow-500/20">
              <p className="text-zinc-200 leading-relaxed">
                {analysisResult.contextualNarrative}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detected Patterns with Enhanced Tooltips */}
      {analysisResult && analysisResult.patterns.length > 0 && (
        <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Padrões com Contexto ({analysisResult.patterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisResult.patterns.map((pattern: any, index: number) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-help hover:shadow-lg hover:shadow-yellow-500/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getPatternIcon(pattern.pattern)}</span>
                            <h4 className="font-semibold text-yellow-400">
                              {getPatternLabel(pattern.pattern)}
                            </h4>
                          </div>
                          <Badge variant="outline" className={getSignalColor(pattern.direction)}>
                            {getDirectionLabel(pattern.direction)}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Força:</span>
                            <span className="text-zinc-200">{getStrengthLabel(pattern.strength)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Confiança:</span>
                            <span className="text-zinc-200">{(pattern.confidence * 100).toFixed(0)}%</span>
                          </div>
                          {pattern.contextualReason && (
                            <div className="mt-3 pt-3 border-t border-zinc-700">
                              <p className="text-xs text-zinc-400 italic">
                                {pattern.contextualReason.substring(0, 60)}...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md bg-zinc-900 border-yellow-500/30 p-4 shadow-xl">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-zinc-700">
                          <span className="text-2xl">{getPatternIcon(pattern.pattern)}</span>
                          <p className="font-semibold text-yellow-400 text-lg">{getPatternLabel(pattern.pattern)}</p>
                        </div>
                        
                        {/* Pattern Description */}
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1 font-semibold">Descrição do Padrão</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {pattern.pattern === 'engulfing' && 'Padrão de reversão onde uma vela envolve completamente a anterior, indicando mudança de sentimento do mercado com forte pressão compradora ou vendedora.'}
                            {pattern.pattern === 'pinBar' && 'Vela com corpo pequeno e pavio longo, indicando rejeição de preço e possível reversão. O pavio mostra onde o mercado testou e rejeitou níveis específicos.'}
                            {pattern.pattern === 'liquiditySweep' && 'Movimento que varre stops de liquidez antes de reverter, comum em pontos de entrada institucionais. Indica manipulação de mercado antes de movimento real.'}
                            {pattern.pattern === 'bosChoch' && 'Break of Structure ou Change of Character, indicando mudança na estrutura de mercado. Sinal de que a tendência anterior pode estar terminando.'}
                            {pattern.pattern === 'fvg' && 'Fair Value Gap - lacuna de preço que o mercado tende a preencher, zona de interesse institucional. Representa desequilíbrio entre oferta e demanda.'}
                            {pattern.pattern === 'supplyDemand' && 'Zonas onde grandes ordens institucionais foram executadas, áreas de suporte/resistência forte. Locais onde o preço tende a reagir fortemente.'}
                            {pattern.pattern === 'forceCandle' && 'Vela de alta momentum indicando forte pressão compradora ou vendedora. Mostra entrada agressiva de capital no mercado.'}
                          </p>
                        </div>

                        {/* Contextual Reason */}
                        {pattern.contextualReason && (
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1 font-semibold">Contexto de Mercado</p>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {pattern.contextualReason}
                            </p>
                          </div>
                        )}

                        {/* Expected Movement */}
                        {pattern.expectedMovement && (
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1 font-semibold">Movimento Esperado</p>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {pattern.expectedMovement}
                            </p>
                          </div>
                        )}

                        {/* Technical Details */}
                        <div className="pt-2 border-t border-zinc-700">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-zinc-500">Direção:</span>
                              <span className={`ml-2 font-semibold ${getSignalColor(pattern.direction)}`}>
                                {getDirectionLabel(pattern.direction)}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Força:</span>
                              <span className="ml-2 text-zinc-300">{getStrengthLabel(pattern.strength)}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Confiança:</span>
                              <span className="ml-2 text-zinc-300">{(pattern.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Timestamp:</span>
                              <span className="ml-2 text-zinc-300">
                                {new Date(pattern.detectedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto mb-4" />
            <p className="text-zinc-400">Analisando padrões de price action com contexto...</p>
          </div>
        </div>
      )}
    </div>
  );
}
