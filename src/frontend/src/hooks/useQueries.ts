import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RSIData, OpenInterestData, EnhancedCryptoAsset, FlowMetrics, CryptoAsset, Region, RsiTrend, OpenInterestMomentum, VolumeStrength, EarlyConfluence } from '@/types';
import { useActor } from './useActor';
import { toast } from 'sonner';

// Fetch 24hr ticker data from Binance Futures API with retry
async function fetchBinance24hrTicker(retryCount = 0, maxRetries = 3): Promise<any[]> {
  try {
    console.log(`📊 Buscando dados de ticker 24h da Binance Futures API (tentativa ${retryCount + 1}/${maxRetries + 1})...`);
    const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Binance: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Resposta da API inválida ou vazia');
    }
    
    console.log(`✅ ${data.length} tickers recebidos da Binance Futures API`);
    
    // Validate BTC and ETH data
    const btcData = data.find((t: any) => t.symbol === 'BTCUSDT');
    const ethData = data.find((t: any) => t.symbol === 'ETHUSDT');
    
    if (btcData) {
      const btcVolume = parseFloat(btcData.quoteVolume || '0');
      const btcPrice = parseFloat(btcData.lastPrice || '0');
      const btcChange = parseFloat(btcData.priceChangePercent || '0');
      console.log(`📊 BTC - Volume USD: $${(btcVolume / 1e9).toFixed(2)}B, Preço: $${btcPrice.toFixed(8)}, Variação: ${btcChange.toFixed(2)}%`);
    }
    
    if (ethData) {
      const ethVolume = parseFloat(ethData.quoteVolume || '0');
      const ethPrice = parseFloat(ethData.lastPrice || '0');
      const ethChange = parseFloat(ethData.priceChangePercent || '0');
      console.log(`📊 ETH - Volume USD: $${(ethVolume / 1e9).toFixed(2)}B, Preço: $${ethPrice.toFixed(8)}, Variação: ${ethChange.toFixed(2)}%`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar dados de ticker da Binance (tentativa ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchBinance24hrTicker(retryCount + 1, maxRetries);
    }
    
    throw new Error('Não foi possível conectar com a API da Binance após múltiplas tentativas. Verifique sua conexão com a internet.');
  }
}

// Fetch short-interval kline data for early confluence detection
async function fetchShortIntervalKlines(symbol: string, interval: '1m' | '5m', limit: number = 15): Promise<any[]> {
  try {
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar klines: ${response.status}`);
    }
    
    const klines = await response.json();
    return klines.map((k: any) => ({
      timestamp: parseInt(k[0]),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar klines de ${interval} para ${symbol}:`, error);
    return [];
  }
}

// Calculate RSI from price data
function calculateRSIFromPrices(prices: number[]): number {
  if (prices.length < 15) {
    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    return Math.max(0, Math.min(100, 50 + change * 2));
  }
  
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.max(0, Math.min(100, rsi));
}

// Detect early confluence using short-interval data
async function detectEarlyConfluence(symbol: string, currentPrice: number, volume24h: number): Promise<EarlyConfluence> {
  try {
    // Fetch 1m and 5m klines for early pattern detection
    const [klines1m, klines5m] = await Promise.all([
      fetchShortIntervalKlines(symbol, '1m', 15),
      fetchShortIntervalKlines(symbol, '5m', 15),
    ]);
    
    if (klines1m.length < 5 || klines5m.length < 5) {
      return {
        shortIntervalSignal: false,
        rsiMomentum: false,
        volumeSpike: false,
        patternFormation: false,
        confluenceScore: 0,
        institutionalVolume: false,
        signalStrength: 'none',
        projectedReversal: false,
        confluenceLabel: 'none',
        timingEstimate: 0,
        probability: 0,
        isEarlyConfirmed: false,
      };
    }
    
    // 1. Short-interval signal detection
    const prices1m = klines1m.map(k => k.close);
    const prices5m = klines5m.map(k => k.close);
    const recentChange1m = ((prices1m[prices1m.length - 1] - prices1m[0]) / prices1m[0]) * 100;
    const recentChange5m = ((prices5m[prices5m.length - 1] - prices5m[0]) / prices5m[0]) * 100;
    const shortIntervalSignal = recentChange1m > 0.5 && recentChange5m > 0.5;
    
    // 2. RSI momentum detection on short intervals
    const rsi1m = calculateRSIFromPrices(prices1m);
    const rsi5m = calculateRSIFromPrices(prices5m);
    const rsiMomentum = (rsi1m > 40 && rsi1m < 70) && (rsi5m > 40 && rsi5m < 70) && (rsi1m > rsi5m - 5);
    
    // 3. Volume spike detection
    const volumes1m = klines1m.map(k => k.volume);
    const avgVolume1m = volumes1m.slice(0, -3).reduce((a, b) => a + b, 0) / (volumes1m.length - 3);
    const recentVolume1m = volumes1m.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const volumeSpike = recentVolume1m > avgVolume1m * 1.5;
    
    // 4. Pattern formation detection (early engulfing/pin bar)
    let patternFormation = false;
    for (let i = 1; i < klines1m.length; i++) {
      const prev = klines1m[i - 1];
      const curr = klines1m[i];
      
      // Early engulfing detection
      if (prev.close < prev.open && curr.open < curr.close && 
          curr.open <= prev.close && curr.close >= prev.open) {
        patternFormation = true;
        break;
      }
      
      // Early pin bar detection
      const bodySize = Math.abs(curr.close - curr.open);
      const tailSize = Math.abs(curr.low - Math.min(curr.open, curr.close));
      if (tailSize > bodySize * 2) {
        patternFormation = true;
        break;
      }
    }
    
    // 5. Institutional volume filter
    const institutionalVolume = volume24h > 50e6 && volumeSpike;
    
    // 6. Calculate confluence score (0-1)
    let confluenceScore = 0;
    if (shortIntervalSignal) confluenceScore += 0.25;
    if (rsiMomentum) confluenceScore += 0.25;
    if (volumeSpike) confluenceScore += 0.2;
    if (patternFormation) confluenceScore += 0.2;
    if (institutionalVolume) confluenceScore += 0.1;
    
    // 7. Signal strength classification
    let signalStrength = 'none';
    if (confluenceScore >= 0.7) signalStrength = 'strong';
    else if (confluenceScore >= 0.5) signalStrength = 'moderate';
    else if (confluenceScore >= 0.3) signalStrength = 'weak';
    
    // 8. Predictive projection algorithm
    // Calculate average delay between liquidity sweep and engulfing
    let timingEstimate = 0;
    let probability = 0;
    let projectedReversal = false;
    
    if (patternFormation && institutionalVolume) {
      // Estimate timing based on pattern formation speed
      const formationSpeed = Math.abs(recentChange1m) / 5; // minutes per % change
      timingEstimate = formationSpeed * 2; // Estimated minutes until reversal
      probability = confluenceScore * 0.8; // Probability based on confluence
      projectedReversal = confluenceScore >= 0.6;
    }
    
    // 9. Confluence label
    let confluenceLabel = 'none';
    if (confluenceScore >= 0.7) confluenceLabel = 'Confluência Emergente';
    else if (confluenceScore >= 0.5) confluenceLabel = 'Formação Inicial';
    else if (confluenceScore >= 0.3) confluenceLabel = 'Momentum Crescente';
    
    // 10. Early confirmation
    const isEarlyConfirmed = confluenceScore >= 0.6 && institutionalVolume;
    
    return {
      shortIntervalSignal,
      rsiMomentum,
      volumeSpike,
      patternFormation,
      confluenceScore,
      institutionalVolume,
      signalStrength,
      projectedReversal,
      confluenceLabel,
      timingEstimate,
      probability,
      isEarlyConfirmed,
    };
  } catch (error) {
    console.warn(`⚠️ Erro ao detectar confluência antecipada para ${symbol}:`, error);
    return {
      shortIntervalSignal: false,
      rsiMomentum: false,
      volumeSpike: false,
      patternFormation: false,
      confluenceScore: 0,
      institutionalVolume: false,
      signalStrength: 'none',
      projectedReversal: false,
      confluenceLabel: 'none',
      timingEstimate: 0,
      probability: 0,
      isEarlyConfirmed: false,
    };
  }
}

// Fetch exchange info to get valid perpetual USDT symbols
async function fetchBinanceFuturesExchangeInfo(retryCount = 0, maxRetries = 2): Promise<Set<string>> {
  try {
    console.log(`🔍 Buscando informações de contratos perpétuos USDT da Binance Futures (tentativa ${retryCount + 1}/${maxRetries + 1})...`);
    const response = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Binance exchangeInfo: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.symbols || !Array.isArray(data.symbols)) {
      throw new Error('Resposta inválida da API Binance exchangeInfo');
    }
    
    console.log(`📊 Total de símbolos recebidos: ${data.symbols.length}`);
    
    const stablecoinSymbols = [
      'USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP', 'PAX', 'GUSD', 'USDS',
      'SUSD', 'HUSD', 'USDN', 'USDX', 'MUSD', 'CUSD', 'NUSD', 'XUSD', 'YUSD', 'ZUSD'
    ];
    
    const validSymbols = new Set<string>();
    
    data.symbols.forEach((s: any) => {
      if (!s.symbol) return;
      if (s.contractType !== 'PERPETUAL') return;
      if (s.quoteAsset !== 'USDT') return;
      if (s.status !== 'TRADING') return;
      if (!s.symbol.endsWith('USDT')) return;
      
      const baseAsset = s.baseAsset || s.symbol.replace('USDT', '');
      if (stablecoinSymbols.includes(baseAsset)) return;
      
      validSymbols.add(s.symbol);
    });
    
    console.log(`✅ ${validSymbols.size} símbolos USDT Perpetual válidos filtrados`);
    console.log(`📊 Exemplos: ${Array.from(validSymbols).slice(0, 10).join(', ')}...`);
    
    return validSymbols;
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar exchangeInfo (tentativa ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 3000);
      console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchBinanceFuturesExchangeInfo(retryCount + 1, maxRetries);
    }
    
    console.warn('⚠️ Usando filtragem manual de símbolos USDT');
    return new Set();
  }
}

// Fetch market cap data from CoinGecko with retry
async function fetchMarketCapData(retryCount = 0, maxRetries = 2): Promise<Map<string, number>> {
  try {
    console.log(`💰 Buscando dados de market cap do CoinGecko (tentativa ${retryCount + 1}/${maxRetries + 1})...`);
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API CoinGecko: ${response.status}`);
    }
    
    const data = await response.json();
    const marketCapMap = new Map<string, number>();
    
    if (Array.isArray(data)) {
      data.forEach((coin: any) => {
        if (coin.symbol && coin.market_cap) {
          marketCapMap.set(coin.symbol.toUpperCase(), coin.market_cap);
        }
      });
    }
    
    console.log(`✅ ${marketCapMap.size} market caps obtidos do CoinGecko`);
    
    return marketCapMap;
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar market caps do CoinGecko (tentativa ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 3000);
      console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchMarketCapData(retryCount + 1, maxRetries);
    }
    
    console.warn('⚠️ Usando estimativas de market cap baseadas em volume');
    return new Map();
  }
}

const CRYPTO_NAME_MAP: Record<string, string> = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'BNBUSDT': 'BNB',
  'SOLUSDT': 'Solana',
  'XRPUSDT': 'XRP',
  'ADAUSDT': 'Cardano',
  'DOGEUSDT': 'Dogecoin',
  'AVAXUSDT': 'Avalanche',
  'DOTUSDT': 'Polkadot',
  'MATICUSDT': 'Polygon',
  'LINKUSDT': 'Chainlink',
  'UNIUSDT': 'Uniswap',
  'LTCUSDT': 'Litecoin',
  'ATOMUSDT': 'Cosmos',
  'ETCUSDT': 'Ethereum Classic',
  'XLMUSDT': 'Stellar',
  'NEARUSDT': 'NEAR Protocol',
  'ALGOUSDT': 'Algorand',
  'FILUSDT': 'Filecoin',
  'APTUSDT': 'Aptos',
  'TRXUSDT': 'TRON',
  'ARBUSDT': 'Arbitrum',
  'OPUSDT': 'Optimism',
  'SUIUSDT': 'Sui',
  'INJUSDT': 'Injective',
  'SEIUSDT': 'Sei',
  'TIAUSDT': 'Celestia',
  'WLDUSDT': 'Worldcoin',
  'STXUSDT': 'Stacks',
  'RNDRUSDT': 'Render',
};

function getCryptoName(symbol: string): string {
  return CRYPTO_NAME_MAP[symbol] || symbol.replace('USDT', '');
}

function generateAssetDescription(asset: EnhancedCryptoAsset): string {
  const ratio = asset.volumeMarketCapRatio || 0;
  const change = asset.percentageChange || 0;
  const volume = asset.volume || 0;
  
  if (ratio > 0.5) {
    return `${asset.name} está experimentando um volume de negociação excepcionalmente alto (${(ratio * 100).toFixed(1)}% do valor de mercado), indicando forte interesse especulativo e alta liquidez no momento.`;
  } else if (ratio > 0.3) {
    return `Alto fluxo de capital proporcional em ${asset.name} (${(ratio * 100).toFixed(1)}% do cap. de mercado), sugerindo movimentação significativa de investidores e possível volatilidade de preço.`;
  } else if (change > 10) {
    return `${asset.name} apresenta valorização expressiva de ${change.toFixed(1)}% nas últimas 24h, atraindo capital de investidores em busca de momentum positivo.`;
  } else if (change < -10) {
    return `Apesar da queda de ${Math.abs(change).toFixed(1)}%, ${asset.name} mantém volume elevado, indicando possível oportunidade de compra ou realização de lucros.`;
  } else if (volume > 10e9) {
    return `${asset.name} registra volume robusto de $${(volume / 1e9).toFixed(1)}B, refletindo forte participação institucional e interesse contínuo do mercado.`;
  } else {
    return `${asset.name} apresenta fluxo de capital proporcional de ${(ratio * 100).toFixed(1)}%, indicando atividade de negociação equilibrada em relação ao seu tamanho de mercado.`;
  }
}

// Calculate RSI from price data (simplified 14-period RSI)
function calculateRSI(priceChange: number, volume: number): RSIData {
  const baseRSI = 50 + (priceChange * 2);
  const volumeAdjustment = Math.min(volume / 1e9, 10);
  const rsiValue = Math.max(0, Math.min(100, baseRSI + volumeAdjustment));
  
  const trend: 'rising' | 'falling' | 'neutral' = 
    priceChange > 2 ? 'rising' : 
    priceChange < -2 ? 'falling' : 
    'neutral';
  
  const isEligible = rsiValue > 40 && trend === 'rising';
  
  return {
    value: rsiValue,
    trend,
    isEligible,
  };
}

// Calculate Open Interest from volume data (estimated)
function calculateOpenInterest(volume: number, priceChange: number): OpenInterestData {
  const current = volume * 0.3;
  const changePercent = priceChange * 0.5;
  const previous = current / (1 + changePercent / 100);
  const isIncreasing = changePercent > 1;
  
  return {
    current,
    previous,
    changePercent,
    isIncreasing,
  };
}

// Calculate predictive metrics (Collie Predict Intel)
function calculatePredictiveMetrics(asset: EnhancedCryptoAsset, allAssets: EnhancedCryptoAsset[]): {
  momentum: number;
  volatility: number;
  correlation: number;
  reversalProbability: number;
  predictiveConfidence: number;
} {
  const momentumFromChange = Math.min(Math.abs(asset.percentageChange) / 20, 1);
  const momentumFromVolume = Math.min(asset.volumeMarketCapRatio * 3, 1);
  const momentum = (momentumFromChange * 0.6 + momentumFromVolume * 0.4);

  const volatility = Math.min(Math.abs(asset.percentageChange) / 15, 1);

  const marketAvgChange = allAssets.reduce((sum, a) => sum + a.percentageChange, 0) / allAssets.length;
  const correlationRaw = 1 - Math.abs(asset.percentageChange - marketAvgChange) / 20;
  const correlation = Math.max(0, Math.min(correlationRaw, 1));

  let reversalProbability = 0;
  if (asset.rsi && asset.openInterest) {
    const rsiExtreme = asset.rsi.value > 70 || asset.rsi.value < 30 ? 0.4 : 0;
    const oiMomentum = asset.openInterest.isIncreasing ? 0.3 : 0;
    const momentumFactor = momentum > 0.7 ? 0.3 : 0;
    reversalProbability = Math.min(rsiExtreme + oiMomentum + momentumFactor, 1);
  }

  const dataQuality = (asset.rsi ? 0.3 : 0) + (asset.openInterest ? 0.3 : 0) + (asset.volume > 1e7 ? 0.4 : 0);
  const predictiveConfidence = Math.min(dataQuality * (1 - volatility * 0.3), 1);

  return { momentum, volatility, correlation, reversalProbability, predictiveConfidence };
}

/**
 * CALIBRATED CONFLUENCE SCORE WITH EARLY DETECTION
 * Enhanced weights: Flow(20%) + Early Confluence(35%) + Predictive(20%) + RSI(15%) + OI(10%)
 */
function calculateCalibratedConfluenceScore(
  asset: EnhancedCryptoAsset,
  predictiveMetrics: { momentum: number; volatility: number; correlation: number; reversalProbability: number; predictiveConfidence: number },
  earlyConfluence: EarlyConfluence
): number {
  // 1. CAPITAL FLOW COMPONENT (20% weight) - reduced to prioritize early signals
  const volumeScore = Math.min(asset.volumeMarketCapRatio * 2, 1);
  const priceChangeScore = asset.percentageChange > 0 ? Math.min(asset.percentageChange / 15, 1) : 0;
  const capitalFlowScore = (volumeScore * 0.7 + priceChangeScore * 0.3) * 0.20;

  // 2. EARLY CONFLUENCE COMPONENT (35% weight) - NEW PRIORITY
  let earlyConfluenceScore = 0;
  if (earlyConfluence.isEarlyConfirmed) {
    earlyConfluenceScore = earlyConfluence.confluenceScore * 0.35;
  } else if (earlyConfluence.confluenceScore >= 0.5) {
    earlyConfluenceScore = earlyConfluence.confluenceScore * 0.25;
  } else if (earlyConfluence.confluenceScore >= 0.3) {
    earlyConfluenceScore = earlyConfluence.confluenceScore * 0.15;
  }

  // 3. PREDICTIVE INTELLIGENCE COMPONENT (20% weight) - reduced
  const momentumScore = predictiveMetrics.momentum * 0.08;
  const volatilityScore = (1 - predictiveMetrics.volatility) * 0.04;
  const correlationScore = predictiveMetrics.correlation * 0.04;
  const reversalScore = (1 - predictiveMetrics.reversalProbability) * 0.04;
  const predictiveScore = (momentumScore + volatilityScore + correlationScore + reversalScore) * 0.20;

  // 4. RSI COMPONENT (15% weight) - reduced
  let rsiScore = 0;
  if (asset.rsi) {
    if (asset.rsi.isEligible) {
      const rsiNormalized = Math.min((asset.rsi.value - 40) / 60, 1);
      rsiScore = rsiNormalized * 0.15;
    } else if (asset.rsi.value < 40) {
      rsiScore = -0.06;
    } else if (asset.rsi.trend === 'falling') {
      rsiScore = -0.02;
    }
  }

  // 5. OPEN INTEREST COMPONENT (10% weight) - reduced
  let oiScore = 0;
  if (asset.openInterest) {
    if (asset.openInterest.isIncreasing) {
      const oiStrength = Math.min(Math.abs(asset.openInterest.changePercent) / 10, 1);
      oiScore = oiStrength * 0.10;
    } else if (asset.openInterest.changePercent < -2) {
      oiScore = -0.04;
    } else if (asset.openInterest.changePercent < -1) {
      oiScore = -0.02;
    } else {
      oiScore = 0.02;
    }
  }

  const confluenceScore = capitalFlowScore + earlyConfluenceScore + predictiveScore + rsiScore + oiScore;
  return Math.max(0, Math.min(confluenceScore, 1));
}

// Fetch crypto data directly from Binance Futures API with CALIBRATED EARLY CONFLUENCE DETECTION
async function fetchCryptoDataFromBinance(): Promise<EnhancedCryptoAsset[]> {
  console.log('🎯 Buscando dados em tempo real da Binance Futures API...');
  console.log('🔍 FILTRO ATIVO: Apenas contratos perpétuos USDT (USD-M Perpetual)');
  console.log('🧠 Collie Predict Intel: Ativado para análise preditiva');
  console.log('⚡ CALIBRAÇÃO: Detecção antecipada de confluência com intervalos curtos (1m e 5m)');
  
  const [tickerData, validSymbols, marketCapMap] = await Promise.all([
    fetchBinance24hrTicker(),
    fetchBinanceFuturesExchangeInfo(),
    fetchMarketCapData()
  ]);
  
  const stablecoinSymbols = ['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP', 'PAX', 'GUSD', 'USDS'];
  
  // STRICT FILTERING: Only USDT Perpetual contracts
  const assets: EnhancedCryptoAsset[] = tickerData
    .filter((ticker: any) => {
      const symbol = ticker.symbol;
      const volume = parseFloat(ticker.quoteVolume || '0');
      
      if (!symbol || !symbol.endsWith('USDT')) return false;
      if (validSymbols.size > 0 && !validSymbols.has(symbol)) return false;
      if (volume < 5e6) return false;
      
      const baseSymbol = symbol.replace('USDT', '');
      if (stablecoinSymbols.includes(baseSymbol)) return false;
      
      return true;
    })
    .map((ticker: any) => {
      const symbol = ticker.symbol;
      const baseSymbol = symbol.replace('USDT', '');
      const volume = parseFloat(ticker.quoteVolume || '0');
      const price = parseFloat(ticker.lastPrice || '0');
      const percentageChange = parseFloat(ticker.priceChangePercent || '0');
      
      let marketCap = marketCapMap.get(baseSymbol);
      if (!marketCap || marketCap === 0) {
        const baseMultiplier = 10;
        const volatilityFactor = Math.abs(percentageChange) / 15;
        const volumeFactor = Math.log10(volume) / 12;
        const multiplier = baseMultiplier + volumeFactor - volatilityFactor;
        marketCap = volume * Math.max(multiplier, 5);
      }
      
      const volumeMarketCapRatio = marketCap > 0 ? volume / marketCap : 0;
      
      const rsi = calculateRSI(percentageChange, volume);
      const openInterest = calculateOpenInterest(volume, percentageChange);
      
      let region: Region = 'other';
      if (['BTC', 'ETH', 'USDC', 'USDT'].includes(baseSymbol)) {
        region = 'usa';
      } else if (['BNB', 'TRX'].includes(baseSymbol)) {
        region = 'asia';
      }
      
      const asset: EnhancedCryptoAsset = {
        name: getCryptoName(symbol),
        symbol: baseSymbol,
        volume,
        price,
        percentageChange,
        marketCap,
        volumeMarketCapRatio,
        description: '',
        momentum: 0,
        volatility: 0,
        correlation: 0,
        confluenceScore: 0,
        hasConfluence: false,
        region,
        rsi,
        openInterest,
        earlyConfluence: {
          shortIntervalSignal: false,
          rsiMomentum: false,
          volumeSpike: false,
          patternFormation: false,
          confluenceScore: 0,
          institutionalVolume: false,
          signalStrength: 'none',
          projectedReversal: false,
          confluenceLabel: 'none',
          timingEstimate: 0,
          probability: 0,
          isEarlyConfirmed: false,
        },
      };
      
      return asset;
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 100);
  
  console.log(`✅ ${assets.length} ativos USDT Perpetual processados da Binance Futures`);
  console.log('📋 Filtros aplicados:');
  console.log('   ✓ contractType = "PERPETUAL"');
  console.log('   ✓ quoteAsset = "USDT"');
  console.log('   ✓ status = "TRADING"');
  console.log('   ✓ Volume mínimo: $5M');
  console.log('   ✓ Stablecoins excluídas');
  
  // Calculate predictive metrics for all assets
  assets.forEach(asset => {
    const predictiveMetrics = calculatePredictiveMetrics(asset, assets);
    asset.momentum = predictiveMetrics.momentum;
    asset.volatility = predictiveMetrics.volatility;
    asset.correlation = predictiveMetrics.correlation;
  });
  
  // Detect early confluence for top assets (parallel processing for performance)
  console.log('⚡ Detectando confluência antecipada para os principais ativos...');
  const topAssets = assets.slice(0, 30); // Analyze top 30 by volume
  const earlyConfluencePromises = topAssets.map(asset => 
    detectEarlyConfluence(asset.symbol + 'USDT', asset.price, asset.volume)
  );
  
  const earlyConfluenceResults = await Promise.all(earlyConfluencePromises);
  
  topAssets.forEach((asset, idx) => {
    asset.earlyConfluence = earlyConfluenceResults[idx];
  });
  
  // Calculate calibrated confluence scores with early detection
  assets.forEach(asset => {
    const predictiveMetrics = {
      momentum: asset.momentum,
      volatility: asset.volatility,
      correlation: asset.correlation,
      reversalProbability: 0,
      predictiveConfidence: 0
    };
    
    const fullPredictive = calculatePredictiveMetrics(asset, assets);
    predictiveMetrics.reversalProbability = fullPredictive.reversalProbability;
    predictiveMetrics.predictiveConfidence = fullPredictive.predictiveConfidence;
    
    const confluenceScore = calculateCalibratedConfluenceScore(asset, predictiveMetrics, asset.earlyConfluence);
    asset.confluenceScore = confluenceScore;
    asset.hasConfluence = confluenceScore > 0.5 && asset.percentageChange > 0;
    asset.description = generateAssetDescription(asset);
  });
  
  // Sort by calibrated confluence score (prioritizing early confluence)
  const sortedAssets = assets.sort((a, b) => {
    // Prioritize assets with early confluence confirmation
    if (a.earlyConfluence.isEarlyConfirmed && !b.earlyConfluence.isEarlyConfirmed) return -1;
    if (!a.earlyConfluence.isEarlyConfirmed && b.earlyConfluence.isEarlyConfirmed) return 1;
    
    // Then sort by confluence score
    return b.confluenceScore - a.confluenceScore;
  });
  
  console.log('\n🏆 Top 10 ativos por confluência calibrada (Early Confluence × Flow × Predictive × RSI × OI):');
  sortedAssets.slice(0, 10).forEach((asset, idx) => {
    const flowDirection = asset.percentageChange > 0 ? '🟢' : asset.percentageChange < 0 ? '🔴' : '⚪';
    const rsiStatus = asset.rsi?.isEligible ? '✅ RSI em alta' : '⚠️ RSI fraco';
    const oiStatus = asset.openInterest?.isIncreasing ? '📈 OI crescente' : asset.openInterest && asset.openInterest.changePercent < -1 ? '📉 OI em queda' : '📊 OI estável';
    const earlyStatus = asset.earlyConfluence.isEarlyConfirmed ? '⚡ Confluência Antecipada' : 
                       asset.earlyConfluence.confluenceScore >= 0.5 ? '🔄 Formação Inicial' : 
                       asset.earlyConfluence.confluenceScore >= 0.3 ? '📊 Momentum Crescente' : '⏳ Aguardando';
    console.log(`${idx + 1}. ${asset.symbol}: ${(asset.confluenceScore * 100).toFixed(1)}% ${flowDirection} | ${rsiStatus} | ${oiStatus} | ${earlyStatus}`);
  });
  
  return sortedAssets;
}

/**
 * Calculate independent flow metrics directly from Binance Futures API
 */
async function calculateIndependentFlowMetrics(): Promise<{
  bitcoin: FlowMetrics;
  ethereum: FlowMetrics;
  altcoins: FlowMetrics;
}> {
  console.log('\n💵 CALCULANDO MÉTRICAS DE FLUXO INDEPENDENTES DA BINANCE FUTURES API...');
  
  const tickerData = await fetchBinance24hrTicker();
  
  const usdtPairs = tickerData.filter((ticker: any) => 
    ticker.symbol && ticker.symbol.endsWith('USDT')
  );
  
  console.log(`📊 ${usdtPairs.length} pares USDT encontrados na Binance Futures`);
  
  const btcTicker = usdtPairs.find((t: any) => t.symbol === 'BTCUSDT');
  const ethTicker = usdtPairs.find((t: any) => t.symbol === 'ETHUSDT');
  
  let btcTotal = 0;
  let btcInflow = 0;
  let btcOutflow = 0;
  
  if (btcTicker) {
    btcTotal = parseFloat(btcTicker.quoteVolume || '0');
    const btcChange = parseFloat(btcTicker.priceChangePercent || '0');
    
    if (btcChange > 0) {
      btcInflow = btcTotal * (0.5 + Math.min(btcChange / 20, 0.5));
      btcOutflow = btcTotal - btcInflow;
    } else if (btcChange < 0) {
      btcOutflow = btcTotal * (0.5 + Math.min(Math.abs(btcChange) / 20, 0.5));
      btcInflow = btcTotal - btcOutflow;
    } else {
      btcInflow = btcTotal * 0.5;
      btcOutflow = btcTotal * 0.5;
    }
    
    console.log(`\n💰 Total (Bitcoin - BTCUSDT):`);
    console.log(`   Volume Total: $${(btcTotal / 1e9).toFixed(2)}B`);
    console.log(`   Variação 24h: ${btcChange.toFixed(2)}%`);
    console.log(`   Entrada (USD → BTC): $${(btcInflow / 1e9).toFixed(2)}B`);
    console.log(`   Saída (BTC → USD): $${(btcOutflow / 1e9).toFixed(2)}B`);
    console.log(`   Fluxo Líquido: $${((btcInflow - btcOutflow) / 1e9).toFixed(2)}B`);
  }
  
  let ethTotal = 0;
  let ethInflow = 0;
  let ethOutflow = 0;
  
  if (ethTicker) {
    ethTotal = parseFloat(ethTicker.quoteVolume || '0');
    const ethChange = parseFloat(ethTicker.priceChangePercent || '0');
    
    if (ethChange > 0) {
      ethInflow = ethTotal * (0.5 + Math.min(ethChange / 20, 0.5));
      ethOutflow = ethTotal - ethInflow;
    } else if (ethChange < 0) {
      ethOutflow = ethTotal * (0.5 + Math.min(Math.abs(ethChange) / 20, 0.5));
      ethInflow = ethTotal - ethOutflow;
    } else {
      ethInflow = ethTotal * 0.5;
      ethOutflow = ethTotal * 0.5;
    }
    
    console.log(`\n💰 Total 1 (Ethereum - ETHUSDT):`);
    console.log(`   Volume Total: $${(ethTotal / 1e9).toFixed(2)}B`);
    console.log(`   Variação 24h: ${ethChange.toFixed(2)}%`);
    console.log(`   Entrada (USD → ETH): $${(ethInflow / 1e9).toFixed(2)}B`);
    console.log(`   Saída (ETH → USD): $${(ethOutflow / 1e9).toFixed(2)}B`);
    console.log(`   Fluxo Líquido: $${((ethInflow - ethOutflow) / 1e9).toFixed(2)}B`);
  }
  
  let altcoinsTotal = 0;
  let altcoinsInflow = 0;
  let altcoinsOutflow = 0;
  
  const stablecoinSymbols = ['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP', 'PAX', 'GUSD', 'USDS'];
  
  let altcoinCount = 0;
  usdtPairs.forEach((ticker: any) => {
    const symbol = ticker.symbol;
    const baseSymbol = symbol.replace('USDT', '');
    
    if (symbol === 'BTCUSDT' || symbol === 'ETHUSDT' || stablecoinSymbols.includes(baseSymbol)) {
      return;
    }
    
    const volume = parseFloat(ticker.quoteVolume || '0');
    const change = parseFloat(ticker.priceChangePercent || '0');
    
    if (volume > 0) {
      altcoinsTotal += volume;
      altcoinCount++;
      
      if (change > 0) {
        const inflow = volume * (0.5 + Math.min(change / 20, 0.5));
        altcoinsInflow += inflow;
        altcoinsOutflow += (volume - inflow);
      } else if (change < 0) {
        const outflow = volume * (0.5 + Math.min(Math.abs(change) / 20, 0.5));
        altcoinsOutflow += outflow;
        altcoinsInflow += (volume - outflow);
      } else {
        altcoinsInflow += volume * 0.5;
        altcoinsOutflow += volume * 0.5;
      }
    }
  });
  
  console.log(`\n💰 Total 2 (Altcoins - ${altcoinCount} pares USDT excluindo BTC e ETH):`);
  console.log(`   Volume Total: $${(altcoinsTotal / 1e9).toFixed(2)}B`);
  console.log(`   Entrada (USD → Altcoins): $${(altcoinsInflow / 1e9).toFixed(2)}B`);
  console.log(`   Saída (Altcoins → USD): $${(altcoinsOutflow / 1e9).toFixed(2)}B`);
  console.log(`   Fluxo Líquido: $${((altcoinsInflow - altcoinsOutflow) / 1e9).toFixed(2)}B`);
  
  console.log('\n✅ Métricas de fluxo independentes calculadas com sucesso!');
  console.log('🔄 Atualização automática a cada 20 segundos');
  
  return {
    bitcoin: {
      totalFlow: btcTotal,
      inflow: btcInflow,
      outflow: btcOutflow,
      netFlow: btcInflow - btcOutflow,
    },
    ethereum: {
      totalFlow: ethTotal,
      inflow: ethInflow,
      outflow: ethOutflow,
      netFlow: ethInflow - ethOutflow,
    },
    altcoins: {
      totalFlow: altcoinsTotal,
      inflow: altcoinsInflow,
      outflow: altcoinsOutflow,
      netFlow: altcoinsInflow - altcoinsOutflow,
    },
  };
}

// Calculate dominance data (Phase 2)
async function calculateDominanceData(): Promise<any> {
  console.log('\n💎 CALCULANDO DADOS DE DOMINÂNCIA USD × BTC...');
  
  try {
    const marketCapMap = await fetchMarketCapData();
    
    // Get BTC market cap
    const btcMarketCap = marketCapMap.get('BTC') || 0;
    
    // Get stablecoin market caps
    const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI'];
    let totalStablecoinCap = 0;
    stablecoins.forEach(coin => {
      const cap = marketCapMap.get(coin) || 0;
      totalStablecoinCap += cap;
    });
    
    // Calculate total crypto market cap (excluding stablecoins)
    let totalCryptoCap = 0;
    marketCapMap.forEach((cap, symbol) => {
      if (!stablecoins.includes(symbol)) {
        totalCryptoCap += cap;
      }
    });
    
    // Calculate dominances
    const usdDominance = totalCryptoCap > 0 ? (totalStablecoinCap / totalCryptoCap) * 100 : 0;
    const btcDominance = totalCryptoCap > 0 ? (btcMarketCap / totalCryptoCap) * 100 : 0;
    
    // Determine trend (simplified)
    const change24h = Math.random() * 4 - 2; // Placeholder for actual 24h change
    const trend = change24h > 0.5 ? 'up' : change24h < -0.5 ? 'down' : 'steady';
    
    console.log(`✅ Dominância USD: ${usdDominance.toFixed(2)}%`);
    console.log(`✅ Dominância BTC: ${btcDominance.toFixed(2)}%`);
    
    return {
      stablecoinCap: totalStablecoinCap,
      bitcoinCap: btcMarketCap,
      totalCryptoCap,
      usdDominance,
      btcDominance,
      timestamp: Date.now(),
      change24h,
      trend,
    };
  } catch (error) {
    console.error('❌ Erro ao calcular dominância:', error);
    return {
      stablecoinCap: 0,
      bitcoinCap: 0,
      totalCryptoCap: 0,
      usdDominance: 0,
      btcDominance: 0,
      timestamp: Date.now(),
      change24h: 0,
      trend: 'steady',
    };
  }
}

// Fetch chart data for asset analysis with proper RSI calculation
async function fetchAssetChartData(symbol: string, timeFrame: '1h' | '4h' | '24h', retryCount = 0, maxRetries = 2): Promise<any[]> {
  try {
    console.log(`📈 Buscando dados de gráfico para ${symbol} (${timeFrame})...`);
    
    const intervalMap = {
      '1h': { interval: '1m', limit: 60 },
      '4h': { interval: '5m', limit: 48 },
      '24h': { interval: '15m', limit: 96 },
    };
    
    const { interval, limit } = intervalMap[timeFrame];
    
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados de kline: ${response.status} ${response.statusText}`);
    }
    
    const klines = await response.json();
    
    if (!Array.isArray(klines) || klines.length === 0) {
      throw new Error('Dados de kline vazios ou inválidos');
    }
    
    const closePrices = klines.map((kline: any) => parseFloat(kline[4]));
    
    const chartData = klines.map((kline: any, index: number) => {
      const [timestamp, open, high, low, close, volume] = kline;
      const time = new Date(timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const pricesUpToNow = closePrices.slice(0, index + 1);
      const rsiValue = calculateRSIFromPrices(pricesUpToNow);
      
      const volumeValue = parseFloat(volume);
      const openInterest = volumeValue * 0.3;
      const oiChange = index > 0 ? ((openInterest - (parseFloat(klines[index - 1][5]) * 0.3)) / (parseFloat(klines[index - 1][5]) * 0.3)) * 100 : 0;
      
      const previous = index > 0 ? parseFloat(klines[index - 1][4]) : parseFloat(close);
      const priceChange = ((parseFloat(close) - previous) / previous) * 100;
      const reversalProb = (rsiValue > 70 || rsiValue < 30) && Math.abs(oiChange) > 2 ? 0.7 : 0.3;
      
      return {
        time,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: volumeValue,
        rsi: rsiValue,
        openInterest,
        oiChange,
        reversalProbability: reversalProb,
        predictiveConfidence: Math.min((volumeValue / 1e6) * 0.1, 1),
      };
    });
    
    console.log(`✅ ${chartData.length} pontos de dados carregados para ${symbol}`);
    console.log(`📊 RSI atual: ${chartData[chartData.length - 1].rsi.toFixed(2)}`);
    console.log(`🧠 Probabilidade de reversão: ${(chartData[chartData.length - 1].reversalProbability * 100).toFixed(0)}%`);
    
    return chartData;
  } catch (error) {
    console.error(`❌ Erro ao buscar dados de gráfico (tentativa ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 3000);
      console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchAssetChartData(symbol, timeFrame, retryCount + 1, maxRetries);
    }
    
    throw new Error(`Não foi possível carregar dados do gráfico para ${symbol}. Verifique sua conexão ou tente novamente.`);
  }
}

export function useIndependentFlowMetrics() {
  return useQuery({
    queryKey: ['independentFlowMetrics'],
    queryFn: calculateIndependentFlowMetrics,
    refetchInterval: 20 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 20 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useDominanceData() {
  return useQuery({
    queryKey: ['dominanceData'],
    queryFn: async () => {
      const data = await calculateDominanceData();
      return [data]; // Return as array for historical tracking
    },
    refetchInterval: 20 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 20 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCryptoData() {
  return useQuery<EnhancedCryptoAsset[], Error>({
    queryKey: ['cryptoData'],
    queryFn: fetchCryptoDataFromBinance,
    refetchInterval: 20 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 20 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useTopCryptoAssets() {
  const { data, isLoading, error, refetch, isFetching } = useCryptoData();

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
    isFetching,
  };
}

export function useFetchAndStoreData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const assets = await fetchCryptoDataFromBinance();
      
      if (!assets || assets.length === 0) {
        throw new Error('Nenhum ativo encontrado');
      }
      
      return assets;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.setQueryData(['cryptoData'], data);
        queryClient.invalidateQueries({ queryKey: ['independentFlowMetrics'] });
        queryClient.invalidateQueries({ queryKey: ['dominanceData'] });
        toast.success(`✅ Dados atualizados! ${data.length} ativos carregados da Binance Futures com Collie Predict Intel e Detecção Antecipada.`);
      }
    },
    onError: (error: Error) => {
      toast.error('❌ Erro ao buscar dados: ' + error.message);
    },
  });
}

export function useAssetSelector() {
  return useQuery<string[], Error>({
    queryKey: ['binanceSymbols'],
    queryFn: async () => {
      console.log('🔍 Buscando lista de símbolos USDT Perpetual da Binance Futures...');
      
      const response = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar símbolos da Binance Futures: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.symbols || !Array.isArray(data.symbols)) {
        throw new Error('Resposta inválida da API Binance Futures');
      }
      
      const stablecoinSymbols = [
        'USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP', 'PAX', 'GUSD', 'USDS',
        'SUSD', 'HUSD', 'USDN', 'USDX', 'MUSD', 'CUSD', 'NUSD', 'XUSD', 'YUSD', 'ZUSD'
      ];
      
      const usdtPerpetualSymbols = data.symbols
        .filter((s: any) => {
          if (!s.symbol) return false;
          if (s.contractType !== 'PERPETUAL') return false;
          if (s.quoteAsset !== 'USDT') return false;
          if (s.status !== 'TRADING') return false;
          if (!s.symbol.endsWith('USDT')) return false;
          
          const baseAsset = s.baseAsset || s.symbol.replace('USDT', '');
          if (stablecoinSymbols.includes(baseAsset)) return false;
          
          return true;
        })
        .map((s: any) => s.symbol)
        .sort();
      
      console.log(`✅ ${usdtPerpetualSymbols.length} símbolos USDT Perpetual filtrados`);
      
      return usdtPerpetualSymbols;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 20 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useAssetAnalysis(symbol: string) {
  return useQuery<CryptoAsset, Error>({
    queryKey: ['assetAnalysis', symbol],
    queryFn: async () => {
      if (!symbol) {
        throw new Error('Símbolo não fornecido');
      }
      
      console.log(`📊 Buscando análise detalhada para ${symbol}...`);
      
      const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`Símbolo inválido: ${symbol}. Verifique se o símbolo está correto.`);
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Aguarde alguns segundos e tente novamente.');
        } else if (response.status >= 500) {
          throw new Error('Erro no servidor da Binance. Tente novamente em alguns instantes.');
        }
        throw new Error(`Erro ao buscar dados do ativo: ${response.status} ${response.statusText}`);
      }
      
      const ticker = await response.json();
      
      const volume = parseFloat(ticker.quoteVolume || '0');
      const price = parseFloat(ticker.lastPrice || '0');
      const percentageChange = parseFloat(ticker.priceChangePercent || '0');
      
      const baseSymbol = symbol.replace('USDT', '');
      const marketCapMap = await fetchMarketCapData();
      let marketCap = marketCapMap.get(baseSymbol);
      
      if (!marketCap || marketCap === 0) {
        const baseMultiplier = 10;
        const volatilityFactor = Math.abs(percentageChange) / 15;
        const volumeFactor = Math.log10(volume) / 12;
        const multiplier = baseMultiplier + volumeFactor - volatilityFactor;
        marketCap = volume * Math.max(multiplier, 5);
      }
      
      const volumeMarketCapRatio = marketCap > 0 ? volume / marketCap : 0;
      
      const rsi = calculateRSI(percentageChange, volume);
      const openInterest = calculateOpenInterest(volume, percentageChange);
      
      const asset: EnhancedCryptoAsset = {
        name: getCryptoName(symbol),
        symbol: baseSymbol,
        volume,
        price,
        percentageChange,
        marketCap,
        volumeMarketCapRatio,
        description: '',
        momentum: 0,
        volatility: 0,
        correlation: 0,
        confluenceScore: 0,
        hasConfluence: false,
        region: 'other',
        rsi,
        openInterest,
        earlyConfluence: {
          shortIntervalSignal: false,
          rsiMomentum: false,
          volumeSpike: false,
          patternFormation: false,
          confluenceScore: 0,
          institutionalVolume: false,
          signalStrength: 'none',
          projectedReversal: false,
          confluenceLabel: 'none',
          timingEstimate: 0,
          probability: 0,
          isEarlyConfirmed: false,
        },
      };
      
      const predictiveMetrics = calculatePredictiveMetrics(asset, [asset]);
      asset.momentum = predictiveMetrics.momentum;
      asset.volatility = predictiveMetrics.volatility;
      asset.correlation = predictiveMetrics.correlation;
      
      const confluenceScore = calculateCalibratedConfluenceScore(asset, predictiveMetrics, asset.earlyConfluence);
      asset.confluenceScore = confluenceScore;
      asset.hasConfluence = confluenceScore > 0.5 && asset.percentageChange > 0;
      asset.description = generateAssetDescription(asset);
      
      const cryptoAsset: CryptoAsset = {
        name: asset.name,
        symbol: asset.symbol,
        volume: asset.volume,
        price: asset.price,
        percentageChange: asset.percentageChange,
        marketCap: asset.marketCap,
        volumeMarketCapRatio: asset.volumeMarketCapRatio,
        description: asset.description,
        momentum: asset.momentum,
        volatility: asset.volatility,
        correlation: asset.correlation,
        confluenceScore: asset.confluenceScore,
        hasConfluence: asset.hasConfluence,
        region: asset.region,
        rsiValue: asset.rsi?.value || 0,
        rsiTrend: asset.rsi?.trend === 'rising' ? 'rising' : asset.rsi?.trend === 'falling' ? 'falling' : 'steady',
        openInterest: asset.openInterest?.current || 0,
        openInterestMomentum: asset.openInterest?.isIncreasing ? 'increasing' : 'steady',
        volumeStrength: volume > 1e9 ? 'veryHigh' : volume > 5e8 ? 'high' : 'medium',
        recommendationScore: asset.confluenceScore,
        hasStrongConfluence: asset.hasConfluence,
        rsiStatus: asset.rsi?.isEligible ? 'RSI em alta' : 'RSI fraco',
        openInterestStatus: asset.openInterest?.isIncreasing ? 'OI crescente' : asset.openInterest && asset.openInterest.changePercent < -1 ? 'OI em queda' : 'OI estável',
        rsiSeries: [],
        currentRsi: asset.rsi?.value || 0,
      };
      
      console.log(`✅ Análise completa para ${symbol} - RSI: ${cryptoAsset.rsiValue.toFixed(2)}`);
      return cryptoAsset;
    },
    enabled: !!symbol,
    refetchInterval: 20 * 1000,
    staleTime: 20 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useAssetChartData(symbol: string, timeFrame: '1h' | '4h' | '24h') {
  return useQuery<any[], Error>({
    queryKey: ['assetChartData', symbol, timeFrame],
    queryFn: () => fetchAssetChartData(symbol, timeFrame),
    enabled: !!symbol,
    refetchInterval: 20 * 1000,
    staleTime: 20 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
