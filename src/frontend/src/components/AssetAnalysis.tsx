import { useState } from 'react';
import { useAssetSelector, useAssetAnalysis } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Target, AlertCircle } from 'lucide-react';
import { formatPortugueseCurrency, formatPortugueseNumber } from '@/lib/formatters';
import AdvancedAssetChart from './AdvancedAssetChart';

export default function AssetAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: symbols, isLoading: symbolsLoading } = useAssetSelector();
  const { data: assetData, isLoading: analysisLoading, error } = useAssetAnalysis(selectedSymbol);

  const filteredSymbols = symbols?.filter(symbol => 
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
          Análise de Ativos
        </h2>
        <p className="text-gray-400">
          Visualização gráfica expandida com camadas dinâmicas e interativas
        </p>
      </div>

      {/* Asset Selector */}
      <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Seletor de Ativos Binance Futures USDT
          </CardTitle>
          <CardDescription className="text-gray-400">
            Escolha um par de negociação para análise detalhada com gráfico multi-camadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar símbolo (ex: BTC, ETH, SOL)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/50 border-yellow-500/30 text-white placeholder:text-gray-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex-1">
              <Select value={selectedSymbol} onValueChange={handleSymbolSelect} disabled={symbolsLoading}>
                <SelectTrigger className="bg-black/50 border-yellow-500/30 text-white focus:border-yellow-500">
                  <SelectValue placeholder={symbolsLoading ? "Carregando símbolos..." : "Selecione um ativo"} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-yellow-500/30 text-white max-h-[300px]">
                  {filteredSymbols.length > 0 ? (
                    filteredSymbols.map((symbol) => (
                      <SelectItem 
                        key={symbol} 
                        value={symbol}
                        className="hover:bg-yellow-500/10 focus:bg-yellow-500/20 cursor-pointer"
                      >
                        {symbol}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'Nenhum símbolo encontrado' : 'Digite para buscar'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {symbolsLoading && (
            <div className="text-center text-gray-400 py-2">
              <Activity className="w-5 h-5 animate-spin inline-block mr-2" />
              Carregando lista de ativos...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Multi-Layer Chart */}
      {selectedSymbol && (
        <AdvancedAssetChart symbol={selectedSymbol} />
      )}

      {/* Analysis Panel */}
      {selectedSymbol && (
        <>
          {analysisLoading ? (
            <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
              <CardHeader>
                <Skeleton className="h-8 w-48 bg-gray-700" />
                <Skeleton className="h-4 w-64 bg-gray-700 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 bg-gray-700" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-zinc-900/80 border-red-500/20 backdrop-blur-md">
              <CardContent className="py-8">
                <div className="text-center space-y-2">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <p className="text-red-400 font-semibold">Erro ao carregar dados do ativo</p>
                  <p className="text-gray-400 text-sm">
                    {error instanceof Error ? error.message : 'Dados indisponíveis'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : assetData ? (
            <div className="space-y-6">
              {/* Asset Header */}
              <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-yellow-500/30 backdrop-blur-md shadow-lg shadow-yellow-500/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-yellow-400 flex items-center gap-2">
                        {assetData.name}
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                          {assetData.symbol}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Binance Futures USDT Perpetual
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        {formatPortugueseCurrency(assetData.price)}
                      </div>
                      <div className={`flex items-center gap-1 justify-end mt-1 ${
                        assetData.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {assetData.percentageChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {assetData.percentageChange >= 0 ? '+' : ''}{assetData.percentageChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Volume */}
                <Card className="bg-zinc-900/80 border-cyan-500/20 backdrop-blur-md hover:border-cyan-500/40 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Volume 24h
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-400">
                      {formatPortugueseCurrency(assetData.volume)}
                    </div>
                    <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min((assetData.volume / 1e9) * 10, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Flow Direction */}
                <Card className={`bg-zinc-900/80 backdrop-blur-md hover:border-opacity-60 transition-all ${
                  assetData.percentageChange >= 0 
                    ? 'border-green-500/20 hover:border-green-500/60' 
                    : 'border-red-500/20 hover:border-red-500/60'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Direção do Fluxo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      assetData.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {assetData.percentageChange >= 0 ? 'Entrada' : 'Saída'}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {assetData.percentageChange >= 0 ? (
                        <>
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-400">USD → {assetData.symbol}</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-gray-400">{assetData.symbol} → USD</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* RSI Status */}
                <Card className="bg-zinc-900/80 border-purple-500/20 backdrop-blur-md hover:border-purple-500/40 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      RSI Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-400">
                      {assetData.rsiValue.toFixed(1)}
                    </div>
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={`${
                          assetData.rsiStatus === 'RSI em alta'
                            ? 'border-green-500/50 text-green-400'
                            : 'border-yellow-500/50 text-yellow-400'
                        }`}
                      >
                        {assetData.rsiStatus}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Open Interest */}
                <Card className="bg-zinc-900/80 border-orange-500/20 backdrop-blur-md hover:border-orange-500/40 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-400" />
                      Open Interest
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">
                      {formatPortugueseNumber(assetData.openInterest)}
                    </div>
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={`${
                          assetData.openInterestStatus === 'OI crescente'
                            ? 'border-green-500/50 text-green-400'
                            : assetData.openInterestStatus === 'OI em queda'
                            ? 'border-red-500/50 text-red-400'
                            : 'border-blue-500/50 text-blue-400'
                        }`}
                      >
                        {assetData.openInterestStatus}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Cap */}
                <Card className="bg-zinc-900/80 border-blue-500/20 backdrop-blur-md hover:border-blue-500/40 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      Market Cap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">
                      {formatPortugueseCurrency(assetData.marketCap)}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Ratio: {(assetData.volumeMarketCapRatio * 100).toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>

                {/* Confluence Score */}
                <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md hover:border-yellow-500/40 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                      <Target className="w-4 h-4 text-yellow-400" />
                      Score de Confluência
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">
                      {(assetData.recommendationScore * 100).toFixed(1)}%
                    </div>
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={`${
                          assetData.hasStrongConfluence
                            ? 'border-green-500/50 text-green-400'
                            : 'border-gray-500/50 text-gray-400'
                        }`}
                      >
                        {assetData.hasStrongConfluence ? 'Forte Confluência' : 'Confluência Moderada'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Análise Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {assetData.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </>
      )}

      {/* Empty State */}
      {!selectedSymbol && !symbolsLoading && (
        <Card className="bg-zinc-900/80 border-yellow-500/20 backdrop-blur-md">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Target className="w-16 h-16 text-yellow-400/50 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Selecione um ativo para começar
                </h3>
                <p className="text-gray-500">
                  Use o seletor acima para escolher um par de negociação e visualizar o gráfico multi-camadas com RSI, Open Interest, Volume e detecção de confluência
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
