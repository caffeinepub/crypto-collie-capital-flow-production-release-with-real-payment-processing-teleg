import { useEffect, useRef } from 'react';
import { useCryptoData } from '@/hooks/useQueries';
import { formatPortugueseCurrency } from '@/lib/formatters';
import { ArrowRight, Globe } from 'lucide-react';

export default function GlobalCapitalFlow() {
  const { data: assets = [], isLoading } = useCryptoData();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate regional flows based on BRT market hours
  const regionalFlows = {
    usa: { inflow: 0, outflow: 0, netFlow: 0 },
    asia: { inflow: 0, outflow: 0, netFlow: 0 },
    europe: { inflow: 0, outflow: 0, netFlow: 0 },
    brasil: { inflow: 0, outflow: 0, netFlow: 0 },
    india: { inflow: 0, outflow: 0, netFlow: 0 },
    arabia: { inflow: 0, outflow: 0, netFlow: 0 },
    africa: { inflow: 0, outflow: 0, netFlow: 0 },
  };

  assets.forEach(asset => {
    const flow = asset.percentageChange > 0 ? asset.volume : -asset.volume;
    let regionKey: keyof typeof regionalFlows = 'usa';
    
    switch (asset.region) {
      case 'usa':
        regionKey = 'usa';
        break;
      case 'asia':
        regionKey = 'asia';
        break;
      case 'europe':
        regionKey = 'europe';
        break;
      case 'brasil':
        regionKey = 'brasil';
        break;
      case 'india':
        regionKey = 'india';
        break;
      case 'arabia':
        regionKey = 'arabia';
        break;
      case 'africa':
        regionKey = 'africa';
        break;
    }
    
    if (asset.percentageChange > 0) {
      regionalFlows[regionKey].inflow += asset.volume;
    } else {
      regionalFlows[regionKey].outflow += Math.abs(asset.volume);
    }
    regionalFlows[regionKey].netFlow += flow;
  });

  // Calculate market segment flows (BTC, ETH, Altcoins)
  const segmentFlows = {
    btc: { inflow: 0, outflow: 0, netFlow: 0 },
    eth: { inflow: 0, outflow: 0, netFlow: 0 },
    altcoins: { inflow: 0, outflow: 0, netFlow: 0 },
  };

  assets.forEach(asset => {
    let segment: 'btc' | 'eth' | 'altcoins' = 'altcoins';
    
    if (asset.symbol === 'BTC') {
      segment = 'btc';
    } else if (asset.symbol === 'ETH') {
      segment = 'eth';
    }
    
    if (asset.percentageChange > 0) {
      segmentFlows[segment].inflow += asset.volume;
    } else {
      segmentFlows[segment].outflow += Math.abs(asset.volume);
    }
    segmentFlows[segment].netFlow += (asset.percentageChange > 0 ? asset.volume : -asset.volume);
  });

  // Canvas animation for flow visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      time += 0.01;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const radius = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.15;

      // Draw USD center
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw USD text
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('USD', centerX, centerY);

      // Draw regional flows with proper positioning for 7 regions
      const regions = [
        { name: 'EUA', angle: 0, flow: regionalFlows.usa, color: '#ef4444' },
        { name: 'Europa', angle: Math.PI * 2 / 7, flow: regionalFlows.europe, color: '#3b82f6' },
        { name: 'Ásia', angle: Math.PI * 4 / 7, flow: regionalFlows.asia, color: '#eab308' },
        { name: 'Brasil', angle: Math.PI * 6 / 7, flow: regionalFlows.brasil, color: '#10b981' },
        { name: 'Índia', angle: Math.PI * 8 / 7, flow: regionalFlows.india, color: '#a855f7' },
        { name: 'Arábia', angle: Math.PI * 10 / 7, flow: regionalFlows.arabia, color: '#f97316' },
        { name: 'África', angle: Math.PI * 12 / 7, flow: regionalFlows.africa, color: '#6366f1' }
      ];

      regions.forEach(region => {
        const distance = radius * 2.5;
        const x = centerX + Math.cos(region.angle) * distance;
        const y = centerY + Math.sin(region.angle) * distance;

        // Draw region circle
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `${region.color}20`;
        ctx.fill();
        ctx.strokeStyle = `${region.color}80`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw region name
        ctx.fillStyle = region.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(region.name, x, y);

        // Draw animated arrow
        const isInflow = region.flow.netFlow > 0;
        const arrowStartX = isInflow ? centerX : x;
        const arrowStartY = isInflow ? centerY : y;
        const arrowEndX = isInflow ? x : centerX;
        const arrowEndY = isInflow ? y : centerY;

        const arrowColor = isInflow ? '#10b981' : '#ef4444';
        const flowStrength = Math.min(Math.abs(region.flow.netFlow) / 1e10, 1);
        const opacity = 0.3 + flowStrength * 0.7;

        // Animated dash offset
        const dashOffset = time * 20;

        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.strokeStyle = `${arrowColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2 + flowStrength * 3;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -dashOffset;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrowhead
        const angle = Math.atan2(arrowEndY - arrowStartY, arrowEndX - arrowStartX);
        const arrowSize = 10;
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
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [assets, regionalFlows]);

  return (
    <div className="space-y-6">
      {/* Global Capital Flow Visualization */}
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 shadow-lg shadow-cyan-500/10">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            Fluxo Global de Capital USD (Horário BRT)
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

            {/* Regional Flow Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              {[
                { name: 'EUA', flag: '🇺🇸', flow: regionalFlows.usa, color: 'red' },
                { name: 'Europa', flag: '🇪🇺', flow: regionalFlows.europe, color: 'blue' },
                { name: 'Ásia', flag: '🌏', flow: regionalFlows.asia, color: 'yellow' },
                { name: 'Brasil', flag: '🇧🇷', flow: regionalFlows.brasil, color: 'green' },
                { name: 'Índia', flag: '🇮🇳', flow: regionalFlows.india, color: 'purple' },
                { name: 'Arábia Saudita', flag: '🇸🇦', flow: regionalFlows.arabia, color: 'orange' },
                { name: 'África', flag: '🇿🇦', flow: regionalFlows.africa, color: 'indigo' }
              ].map((region, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-zinc-800/50 border-zinc-700/30 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{region.flag}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-cyan-400">
                        {region.name}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Entrada:</span>
                      <span className="text-sm font-semibold text-green-400">
                        {formatPortugueseCurrency(region.flow.inflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Saída:</span>
                      <span className="text-sm font-semibold text-red-400">
                        {formatPortugueseCurrency(region.flow.outflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                      <span className="text-xs text-zinc-400">Líquido:</span>
                      <span className={`text-sm font-bold ${region.flow.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPortugueseCurrency(region.flow.netFlow)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Market Segments Flow */}
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 shadow-lg shadow-cyan-500/10">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-6">
          Fluxo por Segmento de Mercado
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { segment: 'Bitcoin', flow: segmentFlows.btc, color: 'orange' },
            { segment: 'Ethereum', flow: segmentFlows.eth, color: 'blue' },
            { segment: 'Altcoins', flow: segmentFlows.altcoins, color: 'purple' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30"
            >
              <h3 className="font-semibold text-cyan-400 mb-3">{item.segment}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Entrada:</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatPortugueseCurrency(item.flow.inflow)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Saída:</span>
                  <span className="text-sm font-semibold text-red-400">
                    {formatPortugueseCurrency(item.flow.outflow)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                  <span className="text-xs text-zinc-400">Líquido:</span>
                  <span className={`text-sm font-bold ${item.flow.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPortugueseCurrency(item.flow.netFlow)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <ArrowRight className={`w-4 h-4 ${item.flow.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-xs text-zinc-400">
                    {item.flow.netFlow >= 0 ? 'Entrada de Capital' : 'Saída de Capital'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
