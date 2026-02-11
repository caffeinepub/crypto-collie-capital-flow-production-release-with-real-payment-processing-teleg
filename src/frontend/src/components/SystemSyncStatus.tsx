import { useEffect, useState } from 'react';
import { useActor } from '@/hooks/useActor';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SyncStatus {
  backendConnected: boolean;
  dataStructuresAligned: boolean;
  functionsValidated: boolean;
  lastSyncTime: Date | null;
  version: string;
}

export default function SystemSyncStatus() {
  const { actor, isFetching } = useActor();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    backendConnected: false,
    dataStructuresAligned: false,
    functionsValidated: false,
    lastSyncTime: null,
    version: '179',
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    validateSync();
  }, [actor]);

  const validateSync = async () => {
    if (!actor || isFetching) return;

    setIsValidating(true);
    try {
      // Test backend connection with ping
      const pingResult = await actor.ping();
      const backendConnected = pingResult.includes('ativo');

      // Validate data structures by testing key functions
      let dataStructuresAligned = false;
      let functionsValidated = false;

      try {
        // Test dominance data structure
        const dominanceData = await actor.getDominanceData();
        dataStructuresAligned = Array.isArray(dominanceData);

        // Test chapter list structure
        const chapters = await actor.listChapters();
        functionsValidated = Array.isArray(chapters);
      } catch (error) {
        console.warn('Validation error:', error);
      }

      setSyncStatus({
        backendConnected,
        dataStructuresAligned,
        functionsValidated,
        lastSyncTime: new Date(),
        version: '179',
      });
    } catch (error) {
      console.error('Sync validation failed:', error);
      setSyncStatus({
        backendConnected: false,
        dataStructuresAligned: false,
        functionsValidated: false,
        lastSyncTime: new Date(),
        version: '179',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const allSynced = syncStatus.backendConnected && syncStatus.dataStructuresAligned && syncStatus.functionsValidated;

  return (
    <Card className="bg-zinc-900/50 border-cyan-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isValidating ? (
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            ) : allSynced ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Estado de Sincronização do Sistema
              </h3>
              <p className="text-xs text-zinc-400">
                Versão {syncStatus.version} - {allSynced ? 'Totalmente Sincronizado' : 'Validando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs ${
                syncStatus.backendConnected
                  ? 'border-green-500/30 text-green-400'
                  : 'border-red-500/30 text-red-400'
              }`}
            >
              {syncStatus.backendConnected ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Backend
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                syncStatus.dataStructuresAligned
                  ? 'border-green-500/30 text-green-400'
                  : 'border-red-500/30 text-red-400'
              }`}
            >
              {syncStatus.dataStructuresAligned ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Estruturas
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                syncStatus.functionsValidated
                  ? 'border-green-500/30 text-green-400'
                  : 'border-red-500/30 text-red-400'
              }`}
            >
              {syncStatus.functionsValidated ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Funções
            </Badge>
          </div>
        </div>
        {syncStatus.lastSyncTime && (
          <p className="text-xs text-zinc-500 mt-2">
            Última validação: {syncStatus.lastSyncTime.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
