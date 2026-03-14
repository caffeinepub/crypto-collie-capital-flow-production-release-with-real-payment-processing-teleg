import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MarketSession {
  name: string;
  region: string;
  flag: string;
  openTime: number;
  closeTime: number;
  preMarketStart: number;
  afterHoursEnd: number;
  timezone: string;
  isOpen: boolean;
  isPreMarket: boolean;
  isAfterHours: boolean;
  nextChange: string;
  status: string;
  progressPercentage: number;
}

function getCurrentBRTHour(): number {
  const now = new Date();
  // Convert UTC to BRT (UTC-3)
  const brtHour = now.getUTCHours() - 3;
  const brtMinutes = now.getUTCMinutes();
  const adjustedHour = brtHour < 0 ? brtHour + 24 : brtHour;
  return adjustedHour + brtMinutes / 60;
}

function getMarketSessions(): MarketSession[] {
  const currentBRTHour = getCurrentBRTHour();

  // Market hours in BRT timezone (matching backend defaultMarketSessions)
  const sessions = [
    {
      name: 'NYSE/NASDAQ',
      region: 'EUA',
      flag: '🇺🇸',
      openTime: 11,
      closeTime: 18,
      preMarketStart: 8,
      afterHoursEnd: 21,
    },
    {
      name: 'LSE',
      region: 'Europa',
      flag: '🇪🇺',
      openTime: 4,
      closeTime: 12,
      preMarketStart: 2,
      afterHoursEnd: 14,
    },
    {
      name: 'Tokyo/Shanghai',
      region: 'Ásia',
      flag: '🌏',
      openTime: 22,
      closeTime: 6,
      preMarketStart: 20,
      afterHoursEnd: 8,
    },
    {
      name: 'B3',
      region: 'Brasil',
      flag: '🇧🇷',
      openTime: 10,
      closeTime: 17,
      preMarketStart: 8,
      afterHoursEnd: 18,
    },
    {
      name: 'NSE',
      region: 'Índia',
      flag: '🇮🇳',
      openTime: 1,
      closeTime: 9,
      preMarketStart: 23,
      afterHoursEnd: 11,
    },
    {
      name: 'Tadawul',
      region: 'Arábia Saudita',
      flag: '🇸🇦',
      openTime: 5,
      closeTime: 10,
      preMarketStart: 3,
      afterHoursEnd: 12,
    },
    {
      name: 'JSE',
      region: 'África',
      flag: '🇿🇦',
      openTime: 4,
      closeTime: 12,
      preMarketStart: 2,
      afterHoursEnd: 14,
    },
  ];

  return sessions.map(session => {
    let isOpen = false;
    let isPreMarket = false;
    let isAfterHours = false;
    let status = 'Fechado';
    let nextChange = '';
    let progressPercentage = 0;

    // Handle markets that cross midnight (e.g., Asia)
    if (session.openTime > session.closeTime) {
      isOpen = currentBRTHour >= session.openTime || currentBRTHour < session.closeTime;
    } else {
      isOpen = currentBRTHour >= session.openTime && currentBRTHour < session.closeTime;
    }

    if (!isOpen) {
      // Check pre-market
      if (session.preMarketStart > session.openTime) {
        // Pre-market crosses midnight
        isPreMarket = currentBRTHour >= session.preMarketStart || currentBRTHour < session.openTime;
      } else {
        isPreMarket = currentBRTHour >= session.preMarketStart && currentBRTHour < session.openTime;
      }

      // Check after-hours
      if (session.closeTime > session.afterHoursEnd) {
        // After-hours crosses midnight
        isAfterHours = currentBRTHour >= session.closeTime || currentBRTHour < session.afterHoursEnd;
      } else {
        isAfterHours = currentBRTHour >= session.closeTime && currentBRTHour < session.afterHoursEnd;
      }
    }

    if (isOpen) {
      status = 'Aberto';
      const totalHours = session.openTime > session.closeTime 
        ? (24 - session.openTime + session.closeTime)
        : (session.closeTime - session.openTime);
      
      let elapsedHours = 0;
      if (session.openTime > session.closeTime) {
        elapsedHours = currentBRTHour >= session.openTime 
          ? currentBRTHour - session.openTime
          : 24 - session.openTime + currentBRTHour;
      } else {
        elapsedHours = currentBRTHour - session.openTime;
      }
      
      progressPercentage = Math.min((elapsedHours / totalHours) * 100, 100);
      nextChange = `Fecha às ${session.closeTime.toString().padStart(2, '0')}:00 BRT`;
    } else if (isPreMarket) {
      status = 'Pré-market';
      nextChange = `Abre às ${session.openTime.toString().padStart(2, '0')}:00 BRT`;
    } else if (isAfterHours) {
      status = 'After-hours';
      nextChange = `Fecha às ${session.afterHoursEnd.toString().padStart(2, '0')}:00 BRT`;
    } else {
      status = 'Fechado';
      
      // Calculate next pre-market time
      let hoursUntilPreMarket = 0;
      if (session.preMarketStart > currentBRTHour) {
        hoursUntilPreMarket = session.preMarketStart - currentBRTHour;
      } else {
        hoursUntilPreMarket = 24 - currentBRTHour + session.preMarketStart;
      }
      
      if (hoursUntilPreMarket < 12) {
        nextChange = `Pré-market às ${session.preMarketStart.toString().padStart(2, '0')}:00 BRT`;
      } else {
        nextChange = `Pré-market amanhã às ${session.preMarketStart.toString().padStart(2, '0')}:00 BRT`;
      }
    }

    return {
      ...session,
      timezone: 'BRT',
      isOpen,
      isPreMarket,
      isAfterHours,
      status,
      nextChange,
      progressPercentage,
    };
  });
}

export default function MarketHours() {
  const [marketSessions, setMarketSessions] = useState<MarketSession[]>(getMarketSessions());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update market sessions every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketSessions(getMarketSessions());
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const openMarkets = marketSessions.filter(s => s.isOpen);
  const hasOverlap = openMarkets.length > 1;

  // Format BRT time
  const formatBRTTime = () => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const brtHours = (utcHours - 3 + 24) % 24;
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    
    return `${brtHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Current BRT Time Display */}
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 shadow-lg shadow-purple-500/10">
        <div className="flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 text-purple-400" />
          <p className="text-lg font-semibold text-purple-400">
            Horário Atual (BRT): {formatBRTTime()}
          </p>
        </div>
      </div>

      {/* Market Hours Status with Timeline Visualization */}
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border border-purple-500/20 rounded-xl p-6 shadow-lg shadow-purple-500/10">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Horários de Mercado (BRT) - Atualização em Tempo Real
          </h2>
        </div>

        {hasOverlap && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400 font-medium">
              ⚡ Período de Sobreposição: {openMarkets.length} mercados ativos simultaneamente - Alta liquidez!
            </p>
            <p className="text-xs text-yellow-300 mt-1">
              Mercados ativos: {openMarkets.map(m => m.region).join(', ')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {marketSessions.map((session, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                session.isOpen
                  ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20'
                  : session.isPreMarket
                  ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                  : session.isAfterHours
                  ? 'bg-orange-500/10 border-orange-500/30 shadow-lg shadow-orange-500/20'
                  : 'bg-zinc-800/50 border-zinc-700/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{session.flag}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm ${
                    session.isOpen ? 'text-green-400' : 
                    session.isPreMarket ? 'text-yellow-400' :
                    session.isAfterHours ? 'text-orange-400' :
                    'text-zinc-400'
                  }`}>
                    {session.name}
                  </h3>
                  <p className="text-xs text-zinc-500">{session.region}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  session.isOpen ? 'bg-green-500/20 text-green-400' :
                  session.isPreMarket ? 'bg-yellow-500/20 text-yellow-400' :
                  session.isAfterHours ? 'bg-orange-500/20 text-orange-400' :
                  'bg-zinc-700/50 text-zinc-400'
                }`}>
                  {session.isOpen ? '🟢' : session.isPreMarket ? '🟡' : session.isAfterHours ? '🟠' : '🔴'}
                  {session.status}
                </span>
              </div>

              {/* Timeline Progress Bar */}
              {session.isOpen && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-400">Progresso da Sessão</span>
                    <span className="text-xs text-green-400 font-semibold">
                      {session.progressPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={session.progressPercentage} 
                    className="h-2 bg-zinc-700/50"
                  />
                </div>
              )}

              {/* Market Hours Timeline */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Pré-market:</span>
                  <span className="text-cyan-400 font-mono">
                    {session.preMarketStart.toString().padStart(2, '0')}:00 BRT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Abertura:</span>
                  <span className="text-green-400 font-mono font-semibold">
                    {session.openTime.toString().padStart(2, '0')}:00 BRT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Fechamento:</span>
                  <span className="text-red-400 font-mono font-semibold">
                    {session.closeTime.toString().padStart(2, '0')}:00 BRT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">After-hours:</span>
                  <span className="text-cyan-400 font-mono">
                    {session.afterHoursEnd.toString().padStart(2, '0')}:00 BRT
                  </span>
                </div>
              </div>

              {/* Visual Timeline Bar */}
              <div className="relative h-8 bg-zinc-800/50 rounded-lg overflow-hidden mb-2">
                {/* Pre-market period */}
                <div 
                  className="absolute inset-y-0 bg-gradient-to-r from-yellow-500/30 to-yellow-500/10"
                  style={{
                    left: `${(session.preMarketStart / 24) * 100}%`,
                    width: `${((session.openTime >= session.preMarketStart ? session.openTime - session.preMarketStart : 24 - session.preMarketStart + session.openTime) / 24) * 100}%`
                  }}
                />
                {/* Main session period */}
                <div 
                  className="absolute inset-y-0 bg-gradient-to-r from-green-500/40 to-green-500/20 shadow-lg shadow-green-500/30"
                  style={{
                    left: `${(session.openTime / 24) * 100}%`,
                    width: `${((session.closeTime > session.openTime ? session.closeTime - session.openTime : 24 - session.openTime + session.closeTime) / 24) * 100}%`
                  }}
                />
                {/* After-hours period */}
                <div 
                  className="absolute inset-y-0 bg-gradient-to-r from-orange-500/30 to-orange-500/10"
                  style={{
                    left: `${(session.closeTime / 24) * 100}%`,
                    width: `${((session.afterHoursEnd > session.closeTime ? session.afterHoursEnd - session.closeTime : 24 - session.closeTime + session.afterHoursEnd) / 24) * 100}%`
                  }}
                />
                {/* Current time indicator */}
                <div 
                  className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-lg shadow-cyan-400/50 z-10"
                  style={{
                    left: `${(getCurrentBRTHour() / 24) * 100}%`
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse" />
                </div>
              </div>

              {/* Next Change Info */}
              <p className="text-xs text-cyan-400 text-center">
                {session.nextChange}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
