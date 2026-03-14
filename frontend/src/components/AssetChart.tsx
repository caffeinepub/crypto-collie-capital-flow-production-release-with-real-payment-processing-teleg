import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ComposedChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { useAssetChartData } from '@/hooks/useQueries';

interface AssetChartProps {
  symbol: string;
}

type ChartType = 'price' | 'rsi' | 'openInterest';
type TimeFrame = '1h' | '4h' | '24h';

export default function AssetChart({ symbol }: AssetChartProps) {
  const [chartType, setChartType] = useState<ChartType>('price');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('4h');

  const { data: chartData, isLoading, error } = useAssetChartData(symbol, timeFrame);

  const chartConfig = useMemo(() => {
    switch (chartType) {
      case 'price':
        return {
          title: 'Preço',
          dataKey: 'close',
          color: '#10b981',
          icon: TrendingUp,
          unit: 'USDT',
        };
      case 'rsi':
        return {
          title: 'RSI (Índice de Força Relativa)',
          dataKey: 'rsi',
          color: '#a855f7',
          icon: Activity,
          unit: '',
        };
      case 'openInterest':
        return {
          title: 'Open Interest',
          dataKey: 'openInterest',
          color: '#f97316',
          icon: BarChart3,
          unit: '',
        };
    }
  }, [chartType]);

  const currentRSI = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return chartData[chartData.length - 1].rsi;
    }
    return null;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg backdrop-blur-md">
          <p className="text-gray-300 text-sm mb-2">{label}</p>
          {chartType === 'price' && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Abertura:</span>
                <span className="text-cyan-400 font-semibold">{data.open?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Máxima:</span>
                <span className="text-green-400 font-semibold">{data.high?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Mínima:</span>
                <span className="text-red-400 font-semibold">{data.low?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Fechamento:</span>
                <span className="text-white font-semibold">{data.close?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Volume:</span>
                <span className="text-blue-400 font-semibold">{(data.volume / 1e6).toFixed(2)}M</span>
              </div>
            </div>
          )}
          {chartType === 'rsi' && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">RSI:</span>
                <span className={`font-semibold ${
                  data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-purple-400'
                }`}>
                  {data.rsi?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${
                  data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {data.rsi > 70 ? 'Sobrecomprado' : data.rsi < 30 ? 'Sobrevendido' : 'Neutro'}
                </span>
              </div>
            </div>
          )}
          {chartType === 'openInterest' && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Open Interest:</span>
                <span className="text-orange-400 font-semibold">{(data.openInterest / 1e6).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Variação:</span>
                <span className={`font-semibold ${
                  data.oiChange > 0 ? 'text-green-400' : data.oiChange < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {data.oiChange > 0 ? '+' : ''}{data.oiChange?.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-gray-500">
          <div className="text-center space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto opacity-50" />
            <p>Nenhum dado disponível para este período</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'price':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={{ stroke: '#4b5563' }}
              />
              <YAxis 
                yAxisId="price"
                stroke="#10b981" 
                tick={{ fill: '#10b981', fontSize: 12 }}
                tickLine={{ stroke: '#10b981' }}
                domain={['auto', 'auto']}
              />
              <YAxis 
                yAxisId="volume"
                orientation="right"
                stroke="#3b82f6" 
                tick={{ fill: '#3b82f6', fontSize: 12 }}
                tickLine={{ stroke: '#3b82f6' }}
                tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorPrice)"
                name="Preço (USDT)"
                dot={false}
              />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="url(#colorVolume)"
                name="Volume"
                opacity={0.6}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'rsi':
        return (
          <div className="space-y-2">
            {currentRSI !== null && (
              <div className="flex items-center justify-between px-4 py-2 bg-black/30 rounded-lg border border-purple-500/20">
                <span className="text-sm text-gray-400">RSI Atual:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    currentRSI > 70 ? 'text-red-400' : currentRSI < 30 ? 'text-green-400' : 'text-purple-400'
                  }`}>
                    {currentRSI.toFixed(2)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`${
                      currentRSI > 70 
                        ? 'border-red-500/50 text-red-400' 
                        : currentRSI < 30 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-yellow-500/50 text-yellow-400'
                    }`}
                  >
                    {currentRSI > 70 ? 'Sobrecomprado' : currentRSI < 30 ? 'Sobrevendido' : 'Neutro'}
                  </Badge>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRSI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={{ stroke: '#4b5563' }}
                />
                <YAxis 
                  stroke="#a855f7" 
                  tick={{ fill: '#a855f7', fontSize: 12 }}
                  tickLine={{ stroke: '#a855f7' }}
                  domain={[0, 100]}
                  ticks={[0, 30, 50, 70, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                  formatter={(value) => <span className="text-gray-300">{value}</span>}
                />
                {/* RSI Overbought zone (70-100) */}
                <ReferenceLine 
                  y={70} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Sobrecomprado (70)', 
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 11
                  }}
                />
                {/* RSI Oversold zone (0-30) */}
                <ReferenceLine 
                  y={30} 
                  stroke="#10b981" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Sobrevendido (30)', 
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 11
                  }}
                />
                {/* RSI neutral line (50) */}
                <ReferenceLine 
                  y={50} 
                  stroke="#6b7280" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  opacity={0.5}
                />
                {/* RSI Line with gradient fill */}
                <Area
                  type="monotone"
                  dataKey="rsi"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fill="url(#colorRSI)"
                  name="RSI"
                  dot={false}
                  isAnimationActive={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'openInterest':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={{ stroke: '#4b5563' }}
              />
              <YAxis 
                stroke="#f97316" 
                tick={{ fill: '#f97316', fontSize: 12 }}
                tickLine={{ stroke: '#f97316' }}
                tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="openInterest"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#colorOI)"
                name="Open Interest"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
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
          <Skeleton className="h-[400px] w-full bg-gray-700" />
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

  const Icon = chartConfig.icon;

  return (
    <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {chartConfig.title} - {symbol}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
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
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant={chartType === 'price' ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              chartType === 'price'
                ? 'bg-green-500 text-black hover:bg-green-400 border-green-500'
                : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
            }`}
            onClick={() => setChartType('price')}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Preço
          </Badge>
          <Badge
            variant={chartType === 'rsi' ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              chartType === 'rsi'
                ? 'bg-purple-500 text-black hover:bg-purple-400 border-purple-500'
                : 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
            }`}
            onClick={() => setChartType('rsi')}
          >
            <Activity className="w-3 h-3 mr-1" />
            RSI
          </Badge>
          <Badge
            variant={chartType === 'openInterest' ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              chartType === 'openInterest'
                ? 'bg-orange-500 text-black hover:bg-orange-400 border-orange-500'
                : 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10'
            }`}
            onClick={() => setChartType('openInterest')}
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Open Interest
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}

