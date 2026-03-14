import { useState } from 'react';
import { useDominanceData } from '@/hooks/useQueries';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3, LineChart } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/precision';

export default function DominanceDashboard() {
  const { data: dominanceData, isLoading, error } = useDominanceData();
  const [selectedView, setSelectedView] = useState<'individual' | 'comparative'>('comparative');
  const [alertThreshold, setAlertThreshold] = useState(5);

  const latestData = dominanceData && dominanceData.length > 0 ? dominanceData[dominanceData.length - 1] : null;

  const getDominanceTrend = (trend: string): { icon: any; color: string; label: string } => {
    switch (trend) {
      case 'up':
        return { icon: TrendingUp, color: 'text-green-400', label: 'Em Alta' };
      case 'down':
        return { icon: TrendingDown, color: 'text-red-400', label: 'Em Baixa' };
      default:
        return { icon: Activity, color: 'text-zinc-400', label: 'Estável' };
    }
  };

  const detectCrossover = (): { hasCrossover: boolean; direction: string; message: string } => {
    if (!dominanceData || dominanceData.length < 2) {
      return { hasCrossover: false, direction: 'none', message: '' };
    }

    const current = dominanceData[dominanceData.length - 1];
    const previous = dominanceData[dominanceData.length - 2];

    const currentDiff = current.usdDominance - current.btcDominance;
    const previousDiff = previous.usdDominance - previous.btcDominance;

    if (previousDiff < 0 && currentDiff > 0) {
      return {
        hasCrossover: true,
        direction: 'usd_above',
        message: 'Dólar ultrapassou Bitcoin em dominância',
      };
    } else if (previousDiff > 0 && currentDiff < 0) {
      return {
        hasCrossover: true,
        direction: 'btc_above',
        message: 'Bitcoin ultrapassou Dólar em dominância',
      };
    }

    return { hasCrossover: false, direction: 'none', message: '' };
  };

  const crossoverInfo = detectCrossover();

  const getRelativeStrength = (): { stronger: string; difference: number; message: string } => {
    if (!latestData) {
      return { stronger: 'none', difference: 0, message: 'Dados insuficientes' };
    }

    const diff = Math.abs(latestData.usdDominance - latestData.btcDominance);
    const stronger = latestData.usdDominance > latestData.btcDominance ? 'usd' : 'btc';

    let message = '';
    if (stronger === 'usd') {
      message = `Dólar está ${formatPercentage(diff, { showSign: false })} mais dominante que Bitcoin`;
    } else {
      message = `Bitcoin está ${formatPercentage(diff, { showSign: false })} mais dominante que Dólar`;
    }

    return { stronger, difference: diff, message };
  };

  const relativeStrength = getRelativeStrength();

  const shouldAlert = (): boolean => {
    if (!latestData) return false;
    return Math.abs(latestData.change24h) >= alertThreshold;
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400">
            Dominância Dólar × Bitcoin
          </h1>
          <p className="text-zinc-400">
            Monitoramento em tempo real da relação entre dominância de stablecoins USD e Bitcoin
          </p>
        </div>
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/50 rounded-2xl p-8 shadow-2xl shadow-red-500/20">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-1">Erro ao Carregar Dados</h3>
              <p className="text-white">
                Não foi possível carregar os dados de dominância. Verifique sua conexão e tente novamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400">
          Dominância Dólar × Bitcoin
        </h1>
        <p className="text-zinc-400">
          Monitoramento em tempo real da relação entre dominância de stablecoins USD e Bitcoin
        </p>
      </div>

      {/* Crossover Alert */}
      {crossoverInfo.hasCrossover && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl shadow-amber-500/20 animate-pulse">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-1">Alerta de Cruzamento</h3>
              <p className="text-white">{crossoverInfo.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Significant Change Alert */}
      {shouldAlert() && latestData && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl shadow-red-500/20">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-1">Mudança Significativa</h3>
              <p className="text-white">
                Variação de {formatPercentage(latestData.change24h, { showSign: true })} nas últimas 24h
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setSelectedView('comparative')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedView === 'comparative'
              ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span>Gráfico Comparativo</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedView('individual')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedView === 'individual'
              ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            <span>Gráficos Individuais</span>
          </div>
        </button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400" />
        </div>
      ) : latestData ? (
        <>
          {/* Current Metrics Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* USD Dominance Card */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-400">Dólar Dominância</h3>
                {(() => {
                  const trend = getDominanceTrend(latestData.trend);
                  const TrendIcon = trend.icon;
                  return <TrendIcon className={`w-6 h-6 ${trend.color}`} />;
                })()}
              </div>
              <div className="space-y-3">
                <div className="text-4xl font-bold text-white">
                  {formatPercentage(latestData.usdDominance, { showSign: false })}
                </div>
                <div className="text-sm text-zinc-400">
                  Market Cap: {formatCurrency(latestData.stablecoinCap, { useAbbreviation: true })}
                </div>
                <div className="h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                    style={{ width: `${Math.min(latestData.usdDominance, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* BTC Dominance Card */}
            <div className="bg-gradient-to-br from-orange-900/40 to-amber-800/40 backdrop-blur-md border border-orange-500/30 rounded-2xl p-6 shadow-2xl shadow-orange-500/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-orange-400">Bitcoin Dominância</h3>
                {(() => {
                  const trend = getDominanceTrend(latestData.trend);
                  const TrendIcon = trend.icon;
                  return <TrendIcon className={`w-6 h-6 ${trend.color}`} />;
                })()}
              </div>
              <div className="space-y-3">
                <div className="text-4xl font-bold text-white">
                  {formatPercentage(latestData.btcDominance, { showSign: false })}
                </div>
                <div className="text-sm text-zinc-400">
                  Market Cap: {formatCurrency(latestData.bitcoinCap, { useAbbreviation: true })}
                </div>
                <div className="h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700"
                    style={{ width: `${Math.min(latestData.btcDominance, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Relative Strength Card */}
            <div className="bg-gradient-to-br from-teal-900/40 to-cyan-800/40 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl shadow-teal-500/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-teal-400">Força Relativa</h3>
                <Activity className="w-6 h-6 text-teal-400" />
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-white">
                  {relativeStrength.stronger === 'usd' ? 'USD' : 'BTC'} +{formatPercentage(relativeStrength.difference, { showSign: false })}
                </div>
                <div className="text-sm text-zinc-400">
                  {relativeStrength.message}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>Variação 24h:</span>
                  <span className={latestData.change24h > 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatPercentage(latestData.change24h, { showSign: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Cap Details */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-6">
              Detalhes de Market Cap
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-400">Market Cap Stablecoins</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(latestData.stablecoinCap, { useAbbreviation: true })}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-400">Market Cap Bitcoin</h3>
                <p className="text-2xl font-bold text-orange-400">
                  {formatCurrency(latestData.bitcoinCap, { useAbbreviation: true })}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-400">Market Cap Total Crypto</h3>
                <p className="text-2xl font-bold text-teal-400">
                  {formatCurrency(latestData.totalCryptoCap, { useAbbreviation: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
            {selectedView === 'comparative' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                  Gráfico Comparativo
                </h2>
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <BarChart3 className="w-20 h-20 text-blue-400 mx-auto opacity-50" />
                    <p className="text-zinc-400">
                      Visualização comparativa em desenvolvimento
                    </p>
                    <p className="text-sm text-zinc-500">
                      Gráfico interativo com sobreposição de dominâncias USD e BTC
                    </p>
                    <div className="mt-6 space-y-2">
                      <p className="text-xs text-zinc-600">Dados atuais disponíveis:</p>
                      <p className="text-sm text-zinc-400">
                        USD: {formatPercentage(latestData.usdDominance, { showSign: false })} | BTC: {formatPercentage(latestData.btcDominance, { showSign: false })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                  Gráficos Individuais
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-blue-400">Dólar Dominância</h3>
                    <div className="h-64 flex items-center justify-center bg-zinc-800/50 rounded-xl">
                      <div className="text-center space-y-2">
                        <LineChart className="w-16 h-16 text-blue-400 mx-auto opacity-50" />
                        <p className="text-zinc-400 text-sm">Gráfico de linha temporal</p>
                        <p className="text-xs text-zinc-500">Valor atual: {formatPercentage(latestData.usdDominance, { showSign: false })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-orange-400">Bitcoin Dominância</h3>
                    <div className="h-64 flex items-center justify-center bg-zinc-800/50 rounded-xl">
                      <div className="text-center space-y-2">
                        <LineChart className="w-16 h-16 text-orange-400 mx-auto opacity-50" />
                        <p className="text-zinc-400 text-sm">Gráfico de linha temporal</p>
                        <p className="text-xs text-zinc-500">Valor atual: {formatPercentage(latestData.btcDominance, { showSign: false })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Correlation Analysis */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-teal-500/30 rounded-2xl p-8 shadow-2xl shadow-teal-500/10">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-6">
              Análise de Correlação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-teal-400">Divergência</h3>
                <p className="text-zinc-300">
                  {latestData.usdDominance > latestData.btcDominance
                    ? 'Dominâncias movendo-se em direções opostas com USD ganhando força'
                    : 'Dominâncias movendo-se em direções opostas com BTC ganhando força'}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-teal-400">Momentum</h3>
                <p className="text-zinc-300">
                  {Math.abs(latestData.change24h) > 3
                    ? 'Momentum forte detectado com mudanças significativas'
                    : 'Momentum moderado com mudanças graduais'}
                </p>
              </div>
            </div>
          </div>

          {/* Alert Configuration */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-8 shadow-2xl shadow-amber-500/10">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-6">
              Configuração de Alertas
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold">
                  Limite de Mudança para Alerta:
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                    className="w-48"
                  />
                  <span className="text-amber-400 font-bold w-16 text-right">
                    {formatPercentage(alertThreshold, { showSign: false })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Você será alertado quando a variação de dominância exceder este limite
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <AlertTriangle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Nenhum dado de dominância disponível no momento</p>
          <p className="text-sm text-zinc-500 mt-2">Aguarde enquanto os dados são carregados...</p>
        </div>
      )}
    </div>
  );
}
