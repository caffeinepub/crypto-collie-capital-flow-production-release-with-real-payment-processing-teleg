import { useEffect, useRef } from 'react';
import { useIndependentFlowMetrics } from '@/hooks/useQueries';
import { formatPortugueseCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function USDFlowMap() {
  const { data: flowMetrics, isLoading, error } = useIndependentFlowMetrics();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate flow data from independent metrics
  const calculateFlowData = () => {
    if (!flowMetrics) {
      return {
        bitcoin: { percentage: 0, direction: 'neutral' as const, intensity: 0, volume: 0, inflow: 0, outflow: 0, netFlow: 0 },
        ethereum: { percentage: 0, direction: 'neutral' as const, intensity: 0, volume: 0, inflow: 0, outflow: 0, netFlow: 0 },
        altcoins: { percentage: 0, direction: 'neutral' as const, intensity: 0, volume: 0, inflow: 0, outflow: 0, netFlow: 0 },
      };
    }

    // Bitcoin (BTC only) - independent calculation
    const bitcoinVolume = flowMetrics.bitcoin.totalFlow;
    const bitcoinInflow = flowMetrics.bitcoin.inflow;
    const bitcoinOutflow = flowMetrics.bitcoin.outflow;
    const bitcoinNetFlow = flowMetrics.bitcoin.netFlow;
    const bitcoinPercentage = bitcoinVolume > 0 ? (bitcoinNetFlow / bitcoinVolume) * 100 : 0;
    const bitcoinDirection = bitcoinNetFlow > 0 ? 'inflow' : bitcoinNetFlow < 0 ? 'outflow' : 'neutral';
    const bitcoinIntensity = bitcoinVolume > 0 ? Math.min(Math.abs(bitcoinNetFlow) / bitcoinVolume, 1) : 0;

    // Ethereum (ETH only) - independent calculation
    const ethereumVolume = flowMetrics.ethereum.totalFlow;
    const ethereumInflow = flowMetrics.ethereum.inflow;
    const ethereumOutflow = flowMetrics.ethereum.outflow;
    const ethereumNetFlow = flowMetrics.ethereum.netFlow;
    const ethereumPercentage = ethereumVolume > 0 ? (ethereumNetFlow / ethereumVolume) * 100 : 0;
    const ethereumDirection = ethereumNetFlow > 0 ? 'inflow' : ethereumNetFlow < 0 ? 'outflow' : 'neutral';
    const ethereumIntensity = ethereumVolume > 0 ? Math.min(Math.abs(ethereumNetFlow) / ethereumVolume, 1) : 0;

    // Altcoins (excluding BTC and ETH) - independent calculation
    const altcoinsVolume = flowMetrics.altcoins.totalFlow;
    const altcoinsInflow = flowMetrics.altcoins.inflow;
    const altcoinsOutflow = flowMetrics.altcoins.outflow;
    const altcoinsNetFlow = flowMetrics.altcoins.netFlow;
    const altcoinsPercentage = altcoinsVolume > 0 ? (altcoinsNetFlow / altcoinsVolume) * 100 : 0;
    const altcoinsDirection = altcoinsNetFlow > 0 ? 'inflow' : altcoinsNetFlow < 0 ? 'outflow' : 'neutral';
    const altcoinsIntensity = altcoinsVolume > 0 ? Math.min(Math.abs(altcoinsNetFlow) / altcoinsVolume, 1) : 0;

    console.log('💵 USD FLOW MAP - Métricas Independentes da Binance Futures:');
    console.log(`   Total (Bitcoin):`);
    console.log(`     Volume: $${(bitcoinVolume / 1e9).toFixed(2)}B`);
    console.log(`     Entrada: $${(bitcoinInflow / 1e9).toFixed(2)}B`);
    console.log(`     Saída: $${(bitcoinOutflow / 1e9).toFixed(2)}B`);
    console.log(`     Líquido: $${(bitcoinNetFlow / 1e9).toFixed(2)}B (${bitcoinPercentage.toFixed(2)}%)`);
    console.log(`     Direção: ${bitcoinDirection}`);
    console.log(`   Total 1 (Ethereum):`);
    console.log(`     Volume: $${(ethereumVolume / 1e9).toFixed(2)}B`);
    console.log(`     Entrada: $${(ethereumInflow / 1e9).toFixed(2)}B`);
    console.log(`     Saída: $${(ethereumOutflow / 1e9).toFixed(2)}B`);
    console.log(`     Líquido: $${(ethereumNetFlow / 1e9).toFixed(2)}B (${ethereumPercentage.toFixed(2)}%)`);
    console.log(`     Direção: ${ethereumDirection}`);
    console.log(`   Total 2 (Altcoins):`);
    console.log(`     Volume: $${(altcoinsVolume / 1e9).toFixed(2)}B`);
    console.log(`     Entrada: $${(altcoinsInflow / 1e9).toFixed(2)}B`);
    console.log(`     Saída: $${(altcoinsOutflow / 1e9).toFixed(2)}B`);
    console.log(`     Líquido: $${(altcoinsNetFlow / 1e9).toFixed(2)}B (${altcoinsPercentage.toFixed(2)}%)`);
    console.log(`     Direção: ${altcoinsDirection}`);

    return {
      bitcoin: { 
        percentage: bitcoinPercentage, 
        direction: bitcoinDirection, 
        intensity: bitcoinIntensity,
        volume: bitcoinVolume,
        inflow: bitcoinInflow,
        outflow: bitcoinOutflow,
        netFlow: bitcoinNetFlow
      },
      ethereum: { 
        percentage: ethereumPercentage, 
        direction: ethereumDirection, 
        intensity: ethereumIntensity,
        volume: ethereumVolume,
        inflow: ethereumInflow,
        outflow: ethereumOutflow,
        netFlow: ethereumNetFlow
      },
      altcoins: { 
        percentage: altcoinsPercentage, 
        direction: altcoinsDirection, 
        intensity: altcoinsIntensity,
        volume: altcoinsVolume,
        inflow: altcoinsInflow,
        outflow: altcoinsOutflow,
        netFlow: altcoinsNetFlow
      },
    };
  };

  const flowData = calculateFlowData();

  // Canvas animation for USD flow visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !flowMetrics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const radius = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.12;

      // Draw USD center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw USD text
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('USD', centerX, centerY);

      // Draw three crypto segments with animated arrows
      const segments = [
        { 
          name: 'Bitcoin', 
          angle: -Math.PI / 2, 
          flow: flowData.bitcoin,
          color: '#f7931a',
          label: 'Total'
        },
        { 
          name: 'Ethereum', 
          angle: Math.PI / 6, 
          flow: flowData.ethereum,
          color: '#627eea',
          label: 'Total 1'
        },
        { 
          name: 'Altcoins', 
          angle: Math.PI * 5 / 6, 
          flow: flowData.altcoins,
          color: '#a855f7',
          label: 'Total 2'
        }
      ];

      segments.forEach(segment => {
        const distance = radius * 2.8;
        const x = centerX + Math.cos(segment.angle) * distance;
        const y = centerY + Math.sin(segment.angle) * distance;

        // Draw segment circle
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = `${segment.color}20`;
        ctx.fill();
        ctx.strokeStyle = `${segment.color}80`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw segment name
        ctx.fillStyle = segment.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(segment.name, x, y - 10);

        // Draw segment label
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px sans-serif';
        ctx.fillText(segment.label, x, y + 10);

        // Only draw arrows if there's actual flow data
        if (segment.flow.volume > 0 && segment.flow.intensity > 0) {
          // Draw animated arrow based on flow direction
          const isInflow = segment.flow.direction === 'inflow';
          const arrowStartX = isInflow ? centerX : x;
          const arrowStartY = isInflow ? centerY : y;
          const arrowEndX = isInflow ? x : centerX;
          const arrowEndY = isInflow ? y : centerY;

          const arrowColor = isInflow ? '#10b981' : '#ef4444';
          const opacity = 0.4 + segment.flow.intensity * 0.6;
          const lineWidth = 2 + segment.flow.intensity * 4;

          // Animated dash offset
          const dashOffset = time * 30;

          // Draw arrow line
          ctx.beginPath();
          ctx.moveTo(arrowStartX, arrowStartY);
          ctx.lineTo(arrowEndX, arrowEndY);
          ctx.strokeStyle = `${arrowColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = lineWidth;
          ctx.setLineDash([15, 8]);
          ctx.lineDashOffset = -dashOffset;
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw arrowhead
          const angle = Math.atan2(arrowEndY - arrowStartY, arrowEndX - arrowStartX);
          const arrowSize = 12 + segment.flow.intensity * 6;
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowEndY);
          ctx.lineTo(
            arrowEndX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowEndY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowEndX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowEndY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = `${arrowColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();

          // Draw glow effect for high intensity
          if (segment.flow.intensity > 0.5) {
            ctx.shadowBlur = 20 * segment.flow.intensity;
            ctx.shadowColor = arrowColor;
            ctx.beginPath();
            ctx.moveTo(arrowStartX, arrowStartY);
            ctx.lineTo(arrowEndX, arrowEndY);
            ctx.strokeStyle = `${arrowColor}40`;
            ctx.lineWidth = lineWidth * 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [flowData, flowMetrics]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados de fluxo: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main USD Flow Visualization */}
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 shadow-lg shadow-cyan-500/10">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            Mapa do Fluxo do Dólar
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-96 rounded-lg"
              style={{ maxHeight: '400px' }}
            />

            {/* Flow Metrics Cards - Three Independent Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Bitcoin (Total) */}
              <div className="p-5 rounded-lg border bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30 transition-all duration-300 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-orange-400">Bitcoin</h3>
                  {flowData.bitcoin.direction === 'inflow' ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : flowData.bitcoin.direction === 'outflow' ? (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Fluxo Líquido:</span>
                    <span className={`text-xl font-bold ${flowData.bitcoin.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {flowData.bitcoin.percentage >= 0 ? '+' : ''}{flowData.bitcoin.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Direção:</span>
                    <span className={`text-sm font-semibold ${
                      flowData.bitcoin.direction === 'inflow' ? 'text-green-400' : 
                      flowData.bitcoin.direction === 'outflow' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {flowData.bitcoin.direction === 'inflow' ? 'USD → BTC' : 
                       flowData.bitcoin.direction === 'outflow' ? 'BTC → USD' : 
                       'Neutro'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Intensidade:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            flowData.bitcoin.direction === 'inflow' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${flowData.bitcoin.intensity * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-cyan-400">
                        {(flowData.bitcoin.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Entrada:</span>
                      <span className="text-xs font-semibold text-green-400">
                        {formatPortugueseCurrency(flowData.bitcoin.inflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Saída:</span>
                      <span className="text-xs font-semibold text-red-400">
                        {formatPortugueseCurrency(flowData.bitcoin.outflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Volume Total:</span>
                      <span className="text-xs font-semibold text-cyan-400">
                        {formatPortugueseCurrency(flowData.bitcoin.volume)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ethereum (Total 1) */}
              <div className="p-5 rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-blue-400">Ethereum</h3>
                  {flowData.ethereum.direction === 'inflow' ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : flowData.ethereum.direction === 'outflow' ? (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Fluxo Líquido:</span>
                    <span className={`text-xl font-bold ${flowData.ethereum.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {flowData.ethereum.percentage >= 0 ? '+' : ''}{flowData.ethereum.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Direção:</span>
                    <span className={`text-sm font-semibold ${
                      flowData.ethereum.direction === 'inflow' ? 'text-green-400' : 
                      flowData.ethereum.direction === 'outflow' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {flowData.ethereum.direction === 'inflow' ? 'USD → ETH' : 
                       flowData.ethereum.direction === 'outflow' ? 'ETH → USD' : 
                       'Neutro'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Intensidade:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            flowData.ethereum.direction === 'inflow' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${flowData.ethereum.intensity * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-cyan-400">
                        {(flowData.ethereum.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Entrada:</span>
                      <span className="text-xs font-semibold text-green-400">
                        {formatPortugueseCurrency(flowData.ethereum.inflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Saída:</span>
                      <span className="text-xs font-semibold text-red-400">
                        {formatPortugueseCurrency(flowData.ethereum.outflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Volume Total:</span>
                      <span className="text-xs font-semibold text-cyan-400">
                        {formatPortugueseCurrency(flowData.ethereum.volume)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Altcoins (Total 2) */}
              <div className="p-5 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-purple-400">Altcoins</h3>
                  {flowData.altcoins.direction === 'inflow' ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : flowData.altcoins.direction === 'outflow' ? (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Fluxo Líquido:</span>
                    <span className={`text-xl font-bold ${flowData.altcoins.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {flowData.altcoins.percentage >= 0 ? '+' : ''}{flowData.altcoins.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Direção:</span>
                    <span className={`text-sm font-semibold ${
                      flowData.altcoins.direction === 'inflow' ? 'text-green-400' : 
                      flowData.altcoins.direction === 'outflow' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {flowData.altcoins.direction === 'inflow' ? 'USD → Altcoins' : 
                       flowData.altcoins.direction === 'outflow' ? 'Altcoins → USD' : 
                       'Neutro'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Intensidade:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            flowData.altcoins.direction === 'inflow' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${flowData.altcoins.intensity * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-cyan-400">
                        {(flowData.altcoins.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Entrada:</span>
                      <span className="text-xs font-semibold text-green-400">
                        {formatPortugueseCurrency(flowData.altcoins.inflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Saída:</span>
                      <span className="text-xs font-semibold text-red-400">
                        {formatPortugueseCurrency(flowData.altcoins.outflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Volume Total:</span>
                      <span className="text-xs font-semibold text-cyan-400">
                        {formatPortugueseCurrency(flowData.altcoins.volume)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
