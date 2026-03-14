import { useState } from 'react';
import { useCryptoData } from '@/hooks/useQueries';
import { formatPrice, formatPercentage, formatCurrency } from '@/lib/precision';
import { detectInstitutionalSetup, getSetupProgressDescription, getConfluenceStatusDescription } from '@/lib/institutionalSetup';
import { calculateInstitutionalCalibration, getCalibrationLevelLabel, getCalibrationLevelColor } from '@/lib/institutionalCalibration';
import { TrendingUp, Zap, Target, ChevronRight, ArrowUp, Activity, TrendingDown, AlertCircle, Shield, CheckCircle, XCircle, Clock, Sparkles, TrendingDown as TrendIcon, Layers, BarChart3, LineChart, Percent, Crosshair } from 'lucide-react';
import type { EnhancedCryptoAsset } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export default function IntelligentRecommendations() {
  const { data: assets = [], isLoading } = useCryptoData();
  const [selectedAsset, setSelectedAsset] = useState<EnhancedCryptoAsset | null>(null);

  // Enhance assets with institutional setup detection and calibration
  const enhancedAssets = assets.map(asset => ({
    ...asset,
    institutionalSetup: detectInstitutionalSetup(asset),
    institutionalCalibration: calculateInstitutionalCalibration(asset),
  }));

  // Filter and sort assets by institutional calibration score
  const recommendedAssets = enhancedAssets
    .filter(asset => {
      const calibration = asset.institutionalCalibration;
      return calibration && calibration.compositeScore >= 30; // Minimum threshold
    })
    .sort((a, b) => {
      const scoreA = a.institutionalCalibration?.compositeScore || 0;
      const scoreB = b.institutionalCalibration?.compositeScore || 0;
      
      // Prioritize excellent calibration
      if (a.institutionalCalibration?.calibrationLevel === 'excellent' && b.institutionalCalibration?.calibrationLevel !== 'excellent') return -1;
      if (b.institutionalCalibration?.calibrationLevel === 'excellent' && a.institutionalCalibration?.calibrationLevel !== 'excellent') return 1;
      
      // Then sort by composite score
      return scoreB - scoreA;
    })
    .slice(0, 20);

  const getRegionLabel = (asset: EnhancedCryptoAsset): string => {
    switch (asset.region) {
      case 'usa': return 'Capital EUA 🇺🇸';
      case 'asia': return 'Capital Ásia 🌏';
      case 'europe': return 'Capital Europa 🇪🇺';
      default: return 'Capital Global 🌍';
    }
  };

  const getVolumeIntensity = (ratio: number): { arrows: number; color: string } => {
    if (ratio >= 0.4) return { arrows: 3, color: 'text-green-400' };
    if (ratio >= 0.2) return { arrows: 2, color: 'text-green-300' };
    if (ratio >= 0.1) return { arrows: 1, color: 'text-yellow-400' };
    return { arrows: 0, color: 'text-zinc-500' };
  };

  const getRSILabel = (asset: EnhancedCryptoAsset): { label: string; color: string; value: string } => {
    if (!asset.rsi) return { label: 'N/D', color: 'text-zinc-500', value: '-' };
    if (asset.rsi.isEligible) {
      return { label: 'RSI em alta', color: 'text-green-400', value: asset.rsi.value.toFixed(0) };
    }
    return { label: 'RSI fraco', color: 'text-red-400', value: asset.rsi.value.toFixed(0) };
  };

  const getOILabel = (asset: EnhancedCryptoAsset): { label: string; color: string; change: string } => {
    if (!asset.openInterest) return { label: 'N/D', color: 'text-zinc-500', change: '-' };
    
    const changeStr = formatPercentage(asset.openInterest.changePercent, { showSign: true });
    
    if (asset.openInterest.isIncreasing) {
      return { label: 'OI crescente', color: 'text-green-400', change: changeStr };
    } else if (asset.openInterest.changePercent < -1) {
      return { label: 'OI declinante', color: 'text-red-400', change: changeStr };
    }
    return { label: 'OI estável', color: 'text-yellow-400', change: changeStr };
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Recomendações Inteligentes
            </h2>
          </div>
          <p className="text-sm text-zinc-400 mb-2">
            Ativos priorizados por calibração institucional avançada com análise multi-critério.
          </p>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-2">
            <Activity className="w-4 h-4" />
            <span>Calibração Institucional: Tendência (25%) × Suportes (20%) × Volume/Transações (20%) × Indicadores (15%) × Shorts (10%) × Pavios (10%)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">⚡ Detecção Antecipada: Intervalos curtos (1m e 5m) com filtro de volume institucional</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">Setup Institucional Completo – Fase Final: 8 Critérios (Liquidez, Manipulação, CHOCH, OB, FVG, Mitigação, Deslocamento, Alvo Institucional)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-semibold">Apenas contratos perpétuos USDT da Binance Futures (USD-M Perpetual)</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
          </div>
        )}

        {/* Recommended Assets Grid */}
        {!isLoading && recommendedAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedAssets.map((asset, idx) => {
              const volumeIntensity = getVolumeIntensity(asset.volumeMarketCapRatio);
              const rsiLabel = getRSILabel(asset);
              const oiLabel = getOILabel(asset);
              const setup = asset.institutionalSetup!;
              const calibration = asset.institutionalCalibration!;
              const earlyConf = asset.earlyConfluence;
              
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedAsset(asset)}
                  className="group relative p-5 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-green-500/20"
                >
                  {/* Calibration Glow Effect */}
                  {calibration.calibrationLevel === 'excellent' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 animate-pulse"></div>
                  )}

                  {/* Institutional Calibration Badge */}
                  {calibration.compositeScore >= 55 && (
                    <div className="absolute -top-2 -left-2 z-20">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-2 shadow-lg shadow-green-500/50 animate-pulse">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-green-500/30 max-w-xs">
                          <p className="text-sm font-semibold text-green-400 mb-1">🎯 Calibração Institucional Avançada</p>
                          <p className="text-xs text-zinc-300 mb-2">
                            Score Composto: {calibration.compositeScore.toFixed(0)}/100
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Tendência:</span>
                              <span className="text-green-400">{(calibration.trendScore * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Suportes:</span>
                              <span className="text-green-400">{(calibration.supportScore * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Vol/Trans:</span>
                              <span className="text-green-400">{(calibration.volumeTransactionScore * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Indicadores:</span>
                              <span className="text-green-400">{(calibration.technicalIndicatorScore * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Shorts:</span>
                              <span className="text-green-400">{(calibration.shortPositionScore * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Pavios:</span>
                              <span className="text-green-400">{(calibration.wickRejectionScore * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-green-500/20">
                            {calibration.recommendation}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Early Confluence Badge */}
                  {earlyConf.isEarlyConfirmed && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2 shadow-lg shadow-purple-500/50 animate-pulse">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-purple-500/30 max-w-xs">
                          <p className="text-sm font-semibold text-purple-400 mb-1">⚡ Confluência Emergente Confirmada</p>
                          <p className="text-xs text-zinc-300 mb-2">
                            Sinal antecipado detectado com volume institucional validado
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className={`flex items-center gap-2 ${earlyConf.shortIntervalSignal ? 'text-green-400' : 'text-zinc-500'}`}>
                              {earlyConf.shortIntervalSignal ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Sinal de Intervalo Curto</span>
                            </div>
                            <div className={`flex items-center gap-2 ${earlyConf.rsiMomentum ? 'text-green-400' : 'text-zinc-500'}`}>
                              {earlyConf.rsiMomentum ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Momentum RSI</span>
                            </div>
                            <div className={`flex items-center gap-2 ${earlyConf.volumeSpike ? 'text-green-400' : 'text-zinc-500'}`}>
                              {earlyConf.volumeSpike ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Pico de Volume</span>
                            </div>
                            <div className={`flex items-center gap-2 ${earlyConf.patternFormation ? 'text-green-400' : 'text-zinc-500'}`}>
                              {earlyConf.patternFormation ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Formação de Padrão</span>
                            </div>
                            <div className={`flex items-center gap-2 ${earlyConf.institutionalVolume ? 'text-green-400' : 'text-zinc-500'}`}>
                              {earlyConf.institutionalVolume ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Volume Institucional</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* Asset Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-green-400">{asset.symbol}</h3>
                        <p className="text-xs text-zinc-400">{asset.name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-green-400 transition-colors" />
                    </div>

                    {/* Price Display with Adaptive Precision */}
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatPrice(asset.price)}
                      </p>
                    </div>

                    {/* Institutional Calibration Score */}
                    <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-3 h-3 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">
                          Calibração Institucional
                        </span>
                        <Badge variant="outline" className={`text-xs ${getCalibrationLevelColor(calibration.calibrationLevel)}`}>
                          {getCalibrationLevelLabel(calibration.calibrationLevel)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Score Composto:</span>
                        <span className="text-green-400 font-semibold">{calibration.compositeScore.toFixed(0)}/100</span>
                      </div>
                    </div>

                    {/* Institutional Setup Progress */}
                    {setup.setupProgress > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="w-3 h-3 text-purple-400" />
                              <span className="text-xs font-semibold text-purple-400">
                                Setup Institucional
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-zinc-400">
                                {setup.setupProgress}/8 critérios
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-purple-500/30 max-w-xs">
                          <p className="text-sm font-semibold text-purple-400 mb-2">Progresso do Setup</p>
                          <div className="space-y-1 text-xs">
                            <div className={`flex items-center gap-2 ${setup.hasLiquidity ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasLiquidity ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Liquidez: {setup.hasLiquidity ? 'Detectada ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasManipulation ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasManipulation ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Manipulação: {setup.hasManipulation ? 'Detectada ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasCHOCH ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasCHOCH ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>CHOCH: {setup.hasCHOCH ? 'Detectado ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasOb ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasOb ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>OB: {setup.hasOb ? 'Detectado ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasFvg ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasFvg ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>FVG: {setup.hasFvg ? 'Detectado ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasMitigation ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasMitigation ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Mitigação: {setup.hasMitigation ? 'Detectada ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasDisplacement ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasDisplacement ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Deslocamento: {setup.hasDisplacement ? 'Detectado ✅' : 'Aguardando ❌'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${setup.hasInstitutionalTarget ? 'text-green-400' : 'text-zinc-500'}`}>
                              {setup.hasInstitutionalTarget ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>Alvo Institucional: {setup.hasInstitutionalTarget ? 'Detectado ✅' : 'Aguardando ❌'}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Metrics Grid */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">Intensidade de Volume:</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: volumeIntensity.arrows }).map((_, i) => (
                            <ArrowUp key={i} className={`w-3 h-3 ${volumeIntensity.color}`} />
                          ))}
                          {volumeIntensity.arrows === 0 && (
                            <span className="text-xs text-zinc-500">Baixo</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">Variação 24h:</span>
                        <span className={`text-sm font-semibold ${asset.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercentage(asset.percentageChange, { showSign: true })}
                        </span>
                      </div>
                      {/* RSI Status */}
                      {asset.rsi && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-400">RSI Status:</span>
                          <div className="flex items-center gap-1">
                            {asset.rsi.trend === 'rising' ? (
                              <TrendingUp className={`w-3 h-3 ${rsiLabel.color}`} />
                            ) : asset.rsi.trend === 'falling' ? (
                              <TrendingDown className={`w-3 h-3 ${rsiLabel.color}`} />
                            ) : null}
                            <span className={`text-xs font-semibold ${rsiLabel.color}`}>
                              {rsiLabel.label} ({rsiLabel.value})
                            </span>
                          </div>
                        </div>
                      )}
                      {/* OI Status */}
                      {asset.openInterest && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-400">Open Interest:</span>
                          <span className={`text-xs font-semibold ${oiLabel.color}`}>
                            {oiLabel.label} ({oiLabel.change})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Calibration Score Bar */}
                    <div className="pt-3 border-t border-zinc-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-400">Calibração Institucional:</span>
                        <span className={`text-xs font-semibold ${getCalibrationLevelColor(calibration.calibrationLevel)}`}>
                          {getCalibrationLevelLabel(calibration.calibrationLevel)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calibration.compositeScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Region Label */}
                    <div className="mt-3 text-xs text-cyan-400">
                      {getRegionLabel(asset)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Recommendations */}
        {!isLoading && recommendedAssets.length === 0 && (
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-zinc-700/30 rounded-xl p-12 text-center">
            <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400 mb-2">
              Nenhuma Recomendação Disponível
            </h3>
            <p className="text-sm text-zinc-500">
              Aguardando condições de mercado favoráveis para identificar ativos com alto potencial institucional.
            </p>
          </div>
        )}

        {/* Detailed Analysis Dialog */}
        <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
          <DialogContent className="max-w-3xl bg-zinc-900 border-cyan-500/30 text-zinc-100 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Análise Detalhada - Calibração Institucional
              </DialogTitle>
            </DialogHeader>

            {selectedAsset && selectedAsset.institutionalCalibration && (
              <div className="space-y-6">
                {/* Asset Info */}
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                  <div>
                    <h3 className="text-2xl font-bold text-green-400">{selectedAsset.symbol}</h3>
                    <p className="text-sm text-zinc-400">{selectedAsset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cyan-400">
                      {formatPrice(selectedAsset.price)}
                    </p>
                    <p className={`text-sm font-semibold ${selectedAsset.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(selectedAsset.percentageChange, { showSign: true })}
                    </p>
                  </div>
                </div>

                {/* Institutional Calibration Details */}
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-green-400" />
                    <h4 className="text-sm font-semibold text-green-400">🎯 Calibração Institucional Avançada</h4>
                  </div>
                  
                  {/* Composite Score */}
                  <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Score Composto:</span>
                      <span className={`text-lg font-bold ${getCalibrationLevelColor(selectedAsset.institutionalCalibration.calibrationLevel)}`}>
                        {selectedAsset.institutionalCalibration.compositeScore.toFixed(0)}/100
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedAsset.institutionalCalibration.compositeScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Nível: <span className={getCalibrationLevelColor(selectedAsset.institutionalCalibration.calibrationLevel)}>
                        {getCalibrationLevelLabel(selectedAsset.institutionalCalibration.calibrationLevel)}
                      </span>
                    </p>
                  </div>

                  {/* Individual Criteria Scores */}
                  <div className="space-y-3">
                    {/* Tendência */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendIcon className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Tendência (25%)</span>
                        <span className="text-xs text-zinc-400 ml-auto">{(selectedAsset.institutionalCalibration.trendScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.trendStatus}</p>
                    </div>

                    {/* Suportes Institucionais */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Suportes Institucionais (20%)</span>
                        <span className="text-xs text-zinc-400 ml-auto">{(selectedAsset.institutionalCalibration.supportScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.supportStatus}</p>
                    </div>

                    {/* Volume e Transações */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Volume e Transações (20%)</span>
                        <span className="text-xs text-zinc-400 ml-auto">{(selectedAsset.institutionalCalibration.volumeTransactionScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.volumeTransactionStatus}</p>
                    </div>

                    {/* Indicadores Técnicos */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <LineChart className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Indicadores Técnicos (15%)</span>
                        <span className="text-xs text-zinc-400 ml-auto">{(selectedAsset.institutionalCalibration.technicalIndicatorScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.technicalIndicatorStatus}</p>
                    </div>

                    {/* Posições Short */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Posições Short (10%)</span>
                        <span className="text-xs text-zinc-400 ml-auto">{(selectedAsset.institutionalCalibration.shortPositionScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.shortPositionStatus}</p>
                    </div>

                    {/* Pavios Longos */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Crosshair className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Pavios Longos (10%)</span>
                        <span className="text-xs text-zinc-400 ml-auto">{(selectedAsset.institutionalCalibration.wickRejectionScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.wickRejectionStatus}</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm font-semibold text-green-400 mb-1">Recomendação:</p>
                    <p className="text-xs text-zinc-300">{selectedAsset.institutionalCalibration.recommendation}</p>
                  </div>
                </div>

                {/* Additional metrics with adaptive precision */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                    <p className="text-xs text-zinc-400 mb-1">Volume 24h</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {formatCurrency(selectedAsset.volume, { useAbbreviation: true })}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                    <p className="text-xs text-zinc-400 mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {formatCurrency(selectedAsset.marketCap, { useAbbreviation: true })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

