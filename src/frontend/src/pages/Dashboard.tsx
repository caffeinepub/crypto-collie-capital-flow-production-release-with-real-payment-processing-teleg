import { Suspense, lazy, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Layers, ListChecks, BarChart3 } from 'lucide-react';
import RouteLoading from '@/components/RouteLoading';
import { useThreeMinuteTimeframe } from '@/hooks/useThreeMinuteTimeframe';
import { Badge } from '@/components/ui/badge';
import OpportunityRecognitionPanel from '@/components/OpportunityRecognitionPanel';
import OrderBookSymbolSelector from '@/components/OrderBookSymbolSelector';
import ChecklistSignalsPanel3m from '@/components/ChecklistSignalsPanel3m';
import MarketTrendMonitor from '@/components/MarketTrendMonitor';

// Lazy load heavy dashboard components
const USDFlowMap = lazy(() => import('@/components/USDFlowMap'));

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const { data: timeframe } = useThreeMinuteTimeframe();

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Timeframe Indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Markets Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {timeframe || '3m'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Capital Flow</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Opportunity Recognition</span>
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Market</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Checklist</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-6">
          <Suspense fallback={<RouteLoading />}>
            <USDFlowMap />
          </Suspense>
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <OpportunityRecognitionPanel onSelectSymbol={handleSymbolSelect} />
        </TabsContent>

        <TabsContent value="market" className="mt-6 space-y-4">
          <OrderBookSymbolSelector value={selectedSymbol} onChange={setSelectedSymbol} />
          <MarketTrendMonitor symbol={selectedSymbol} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-6 space-y-4">
          <OrderBookSymbolSelector value={selectedSymbol} onChange={setSelectedSymbol} />
          <ChecklistSignalsPanel3m symbol={selectedSymbol} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
