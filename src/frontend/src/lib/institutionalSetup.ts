import type { EnhancedCryptoAsset, InstitutionalSetup } from '@/types';

/**
 * Detects institutional entry criteria for an asset
 * Phase Final: Complete institutional setup with all 8 criteria including Deslocamento and Alvo Institucional
 */
export function detectInstitutionalSetup(asset: EnhancedCryptoAsset): InstitutionalSetup {
  // Criterion 1: Liquidity Detection
  // High volume relative to market cap indicates liquidity zones
  const hasLiquidity = asset.volumeMarketCapRatio > 0.15 && asset.volume > 10e6;

  // Criterion 2: Manipulation Detection
  // Sudden price movements with high volume suggest manipulation/stop hunts
  const hasManipulation = 
    Math.abs(asset.percentageChange) > 3 && 
    asset.volumeMarketCapRatio > 0.2 &&
    asset.volatility > 0.5;

  // Criterion 3: CHOCH (Change of Character) Detection
  // Trend reversal with RSI confirmation and OI momentum
  const hasCHOCH = 
    asset.rsi?.trend === 'rising' &&
    asset.rsi?.value > 45 &&
    asset.openInterest?.isIncreasing === true &&
    asset.percentageChange > 2;

  // Criterion 4: OB (Order Block) Detection
  // Institutional order blocks identified through volume spikes and price rejection
  const hasOb = 
    asset.volumeMarketCapRatio > 0.25 &&
    asset.volume > 15e6 &&
    Math.abs(asset.percentageChange) > 2 &&
    asset.momentum > 0.6;

  // Criterion 5: FVG (Fair Value Gap) Detection
  // Market imbalances with gap size and volume confirmation
  const hasFvg = 
    asset.volatility > 0.6 &&
    Math.abs(asset.percentageChange) > 4 &&
    asset.volumeMarketCapRatio > 0.18 &&
    asset.hasConfluence;

  // Criterion 6: Mitigação Detection
  // Institutional mitigation patterns with retracement and volume confirmation
  const hasMitigation = 
    asset.rsi !== undefined &&
    asset.rsi.value !== undefined &&
    asset.rsi.value > 40 &&
    asset.rsi.value < 70 &&
    asset.openInterest !== undefined &&
    asset.openInterest.changePercent !== undefined &&
    asset.openInterest.changePercent > 1 &&
    asset.momentum > 0.5 &&
    asset.confluenceScore > 0.5;

  // Criterion 7: Deslocamento (Displacement) Detection
  // Significant institutional price movement beyond normal volatility
  const hasDisplacement = 
    Math.abs(asset.percentageChange) > 5 &&
    asset.momentum > 0.7 &&
    asset.volumeMarketCapRatio > 0.3 &&
    asset.volume > 20e6;

  // Criterion 8: Alvo Institucional (Institutional Target) Detection
  // Key level identification through support/resistance and institutional activity
  const hasInstitutionalTarget = 
    asset.volatility > 0.5 &&
    asset.confluenceScore > 0.6 &&
    asset.hasConfluence &&
    asset.momentum > 0.6 &&
    (asset.rsi?.value ?? 0) > 50;

  // Calculate setup progress (out of 8 criteria)
  const criteriaCount = [
    hasLiquidity,
    hasManipulation,
    hasCHOCH,
    hasOb,
    hasFvg,
    hasMitigation,
    hasDisplacement,
    hasInstitutionalTarget
  ].filter(Boolean).length;
  const setupProgress = criteriaCount;

  // Determine setup status
  let setupStatus: 'complete' | 'partial' | 'none' = 'none';
  if (criteriaCount === 8) {
    setupStatus = 'complete';
  } else if (criteriaCount >= 1) {
    setupStatus = 'partial';
  }

  // Determine confluence level based on additional factors
  let confluenceLevel: 'high' | 'medium' | 'low' = 'low';
  if (asset.confluenceScore > 0.7 && criteriaCount >= 6) {
    confluenceLevel = 'high';
  } else if (asset.confluenceScore > 0.5 || criteriaCount >= 4) {
    confluenceLevel = 'medium';
  }

  // Generate setup narrative
  const setupNarrative = generateSetupNarrative({
    hasLiquidity,
    hasManipulation,
    hasCHOCH,
    hasOb,
    hasFvg,
    hasMitigation,
    hasDisplacement,
    hasInstitutionalTarget,
    setupProgress,
    setupStatus,
    confluenceLevel,
  });

  return {
    hasLiquidity,
    hasManipulation,
    hasCHOCH,
    hasOb,
    hasFvg,
    hasMitigation,
    hasDisplacement,
    hasInstitutionalTarget,
    setupProgress,
    setupStatus,
    confluenceLevel,
    setupNarrative,
  };
}

/**
 * Generate narrative description for institutional setup
 */
function generateSetupNarrative(setup: InstitutionalSetup): string {
  const criteria: string[] = [];
  
  if (setup.hasLiquidity) criteria.push('Liquidez ✅');
  if (setup.hasManipulation) criteria.push('Manipulação ✅');
  if (setup.hasCHOCH) criteria.push('CHOCH ✅');
  if (setup.hasOb) criteria.push('OB ✅');
  if (setup.hasFvg) criteria.push('FVG ✅');
  if (setup.hasMitigation) criteria.push('Mitigação ✅');
  if (setup.hasDisplacement) criteria.push('Deslocamento ✅');
  if (setup.hasInstitutionalTarget) criteria.push('Alvo Institucional ✅');

  if (criteria.length === 0) {
    return 'Nenhum critério institucional detectado. Aguardando condições de mercado favoráveis.';
  }

  let narrative = `Setup Institucional: ${criteria.join(' → ')} | `;

  if (setup.setupStatus === 'complete') {
    narrative += 'Setup completo validado. Todos os oito critérios atendidos. Configuração institucional confirmada com alta probabilidade de movimento significativo.';
  } else if (setup.setupProgress >= 6) {
    narrative += 'Setup quase completo. Maioria dos critérios atendidos. Aguardar confirmação dos critérios restantes para validação completa.';
  } else if (setup.setupProgress >= 4) {
    narrative += 'Configuração parcial detectada. Metade dos critérios confirmados. Monitorar evolução para confirmação adicional.';
  } else {
    narrative += 'Setup institucional em análise inicial. Critérios básicos detectados. Aguarde confirmação adicional.';
  }

  return narrative;
}

/**
 * Get progress description for institutional setup
 */
export function getSetupProgressDescription(setup: InstitutionalSetup): string {
  const criteria: string[] = [];
  
  if (setup.hasLiquidity) criteria.push('Liq');
  if (setup.hasManipulation) criteria.push('Man');
  if (setup.hasCHOCH) criteria.push('CHOCH');
  if (setup.hasOb) criteria.push('OB');
  if (setup.hasFvg) criteria.push('FVG');
  if (setup.hasMitigation) criteria.push('Mit');
  if (setup.hasDisplacement) criteria.push('Desl');
  if (setup.hasInstitutionalTarget) criteria.push('Alvo');

  if (criteria.length === 0) {
    return 'Nenhum critério detectado';
  }

  return `${criteria.join(' ✓ ')} (${setup.setupProgress}/8)`;
}

/**
 * Get confluence status description
 */
export function getConfluenceStatusDescription(setup: InstitutionalSetup): string {
  switch (setup.confluenceLevel) {
    case 'high':
      return 'Confluência Alta - Setup institucional forte';
    case 'medium':
      return 'Confluência Média - Setup institucional moderado';
    case 'low':
      return 'Confluência Baixa - Aguardar confirmação adicional';
    default:
      return 'Sem confluência';
  }
}

/**
 * Get detailed criterion description
 */
export function getCriterionDescription(criterion: string): string {
  switch (criterion) {
    case 'liquidity':
      return 'Liquidez: Zonas de alta liquidez identificadas através de volume elevado em relação ao market cap.';
    case 'manipulation':
      return 'Manipulação: Movimentos bruscos de preço com volume alto sugerindo varredura de stops institucionais.';
    case 'choch':
      return 'CHOCH: Mudança de caráter detectada com reversão de tendência confirmada por RSI e Open Interest.';
    case 'ob':
      return 'OB (Order Block): Blocos de ordens institucionais identificados através de picos de volume e rejeição de preço.';
    case 'fvg':
      return 'FVG (Fair Value Gap): Desequilíbrios de mercado com gaps de preço e confirmação de volume.';
    case 'mitigation':
      return 'Mitigação: Padrões de mitigação institucional com retração e confirmação de volume.';
    case 'displacement':
      return 'Deslocamento: Movimento de preço institucional significativo além da volatilidade normal com volume confirmado.';
    case 'institutionalTarget':
      return 'Alvo Institucional: Níveis-chave identificados através de suporte/resistência e atividade institucional repetida.';
    default:
      return '';
  }
}
