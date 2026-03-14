import { useThreeMinuteCandles } from '@/hooks/useThreeMinuteCandles';
import { calculateChecklistSignals3m } from '@/lib/checklistSignals3m';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, HelpCircle, ListChecks } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChecklistSignalsPanel3mProps {
  symbol: string;
}

export default function ChecklistSignalsPanel3m({ symbol }: ChecklistSignalsPanel3mProps) {
  const { data: candles, isLoading, error } = useThreeMinuteCandles(symbol, 100);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            3m Checklist Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            3m Checklist Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            3m Checklist Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No candle data available</p>
        </CardContent>
      </Card>
    );
  }

  const result = calculateChecklistSignals3m(candles);

  const getStatusIcon = (status: 'met' | 'not-met' | 'unknown') => {
    switch (status) {
      case 'met':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'not-met':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'unknown':
        return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTrendBadge = () => {
    const colors = {
      bullish: 'bg-green-500/20 text-green-500 border-green-500/50',
      bearish: 'bg-red-500/20 text-red-500 border-red-500/50',
      neutral: 'bg-muted text-muted-foreground border-border',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${colors[result.trendDirection]}`}>
        {result.trendDirection.toUpperCase()}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="w-5 h-5" />
          3m Checklist Signals - {symbol}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Trend:</span>
          {getTrendBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {result.signals.map((signal) => (
            <div
              key={signal.step}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(signal.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {signal.step}
                  </span>
                  <span className="text-sm font-semibold">{signal.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{signal.details}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {result.entryPrice !== null && (
          <div className="mt-6 p-4 rounded-lg border border-primary/50 bg-primary/5">
            <h4 className="text-sm font-semibold mb-3">Trade Setup Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Entry</span>
                <span className="font-semibold">{result.entryPrice.toFixed(2)}</span>
              </div>
              {result.stopLoss !== null && (
                <div>
                  <span className="text-muted-foreground block mb-1">Stop Loss</span>
                  <span className="font-semibold text-red-500">{result.stopLoss.toFixed(2)}</span>
                </div>
              )}
              {result.target !== null && (
                <div>
                  <span className="text-muted-foreground block mb-1">Target</span>
                  <span className="font-semibold text-green-500">{result.target.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
