// Opportunity Recognition Panel with multi-strategy ranking and trading mode filtering

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Target, Info } from 'lucide-react';
import { useOpportunityRecognitionRanking } from '@/hooks/useOpportunityRecognitionRanking';
import { STRATEGY_MODALITIES, StrategyModality, OpportunityScore } from '@/lib/opportunityScoring';
import { TIMEFRAME_OPTIONS, DEFAULT_TIMEFRAMES } from '@/lib/opportunityTimeframes';
import { TradingMode } from './TradingModeSelector';

interface OpportunityRecognitionPanelProps {
  onSelectSymbol?: (symbol: string) => void;
  tradingMode?: TradingMode;
}

export default function OpportunityRecognitionPanel({ onSelectSymbol, tradingMode }: OpportunityRecognitionPanelProps) {
  const [selectedModality, setSelectedModality] = useState<StrategyModality>('dayTrade');
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>(DEFAULT_TIMEFRAMES);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailScore, setDetailScore] = useState<OpportunityScore | null>(null);

  const { data: rankings, isLoading, error } = useOpportunityRecognitionRanking(
    selectedModality,
    selectedTimeframes,
    20
  );

  // Filter and prioritize opportunities based on trading mode
  const filteredRankings = useMemo(() => {
    if (!rankings || !tradingMode) return rankings;

    // Map trading modes to preferred timeframes
    const timeframePreferences: Record<TradingMode, string[]> = {
      'Day Trade': ['3m', '15m'],
      'Swing Trade': ['1h', '4h'],
      'Scalping': ['3m'],
      'Position Trading': ['4h', '1h'],
    };

    const preferredTimeframes = timeframePreferences[tradingMode] || [];

    // Score boost for opportunities matching the trading mode's preferred timeframes
    return rankings.map(opp => {
      const hasPreferredTimeframe = preferredTimeframes.some(tf => 
        selectedTimeframes.includes(tf)
      );
      
      // Boost score slightly if it matches the trading mode preference
      const boostedScore = hasPreferredTimeframe ? opp.score + 2 : opp.score;
      
      return {
        ...opp,
        score: Math.min(100, boostedScore), // Cap at 100
      };
    }).sort((a, b) => b.score - a.score);
  }, [rankings, tradingMode, selectedTimeframes]);

  const handleTimeframeToggle = (timeframeId: string) => {
    setSelectedTimeframes(prev => {
      if (prev.includes(timeframeId)) {
        // Don't allow removing all timeframes
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== timeframeId);
      } else {
        return [...prev, timeframeId];
      }
    });
  };

  const handleRowClick = (score: OpportunityScore) => {
    // Notify parent component of symbol selection
    if (onSelectSymbol) {
      onSelectSymbol(score.symbol);
    }
    
    // Open details dialog
    setDetailScore(score);
    setDetailDialogOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  // Group modalities by category
  const modalitiesByCategory = STRATEGY_MODALITIES.reduce((acc, modality) => {
    if (!acc[modality.category]) {
      acc[modality.category] = [];
    }
    acc[modality.category].push(modality);
    return acc;
  }, {} as Record<string, typeof STRATEGY_MODALITIES>);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error loading opportunities: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Opportunity Recognition
            {tradingMode && (
              <Badge variant="outline" className="ml-2 text-xs">
                {tradingMode}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Multi-strategy ranking based on technical analysis and market structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Modality Selector */}
          <div className="space-y-2">
            <Label htmlFor="modality-select">Strategy Modality</Label>
            <Select value={selectedModality} onValueChange={(value) => setSelectedModality(value as StrategyModality)}>
              <SelectTrigger id="modality-select" className="bg-card border border-border z-[50]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-[100]">
                {Object.entries(modalitiesByCategory).map(([category, modalities]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                    {modalities.map(modality => (
                      <SelectItem key={modality.id} value={modality.id}>
                        {modality.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {STRATEGY_MODALITIES.find(m => m.id === selectedModality)?.description}
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="space-y-2">
            <Label>Timeframes</Label>
            <div className="flex flex-wrap gap-4">
              {TIMEFRAME_OPTIONS.map(tf => (
                <div key={tf.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tf-${tf.id}`}
                    checked={selectedTimeframes.includes(tf.id)}
                    onCheckedChange={() => handleTimeframeToggle(tf.id)}
                  />
                  <Label htmlFor={`tf-${tf.id}`} className="text-sm cursor-pointer">
                    {tf.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTimeframes.map(tfId => {
                const tf = TIMEFRAME_OPTIONS.find(t => t.id === tfId);
                return tf ? (
                  <Badge key={tfId} variant="outline" className="text-xs border">
                    {tf.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Rankings Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredRankings || filteredRankings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No opportunities found for the selected strategy and timeframes
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Conditions</TableHead>
                    <TableHead>Why it ranked</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.map((score, index) => {
                    const metConditions = score.conditions.filter(c => c.met).length;
                    const totalConditions = score.conditions.length;

                    return (
                      <TableRow
                        key={score.symbol}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleRowClick(score)}
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-semibold">{score.symbol}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getScoreBadgeVariant(score.score)} className={getScoreColor(score.score)}>
                            {score.score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {metConditions}/{totalConditions}
                        </TableCell>
                        <TableCell className="text-sm">
                          {score.narrative}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(score);
                            }}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {detailScore?.symbol} - Detailed Analysis
            </DialogTitle>
            <DialogDescription>
              Strategy: {STRATEGY_MODALITIES.find(m => m.id === selectedModality)?.label}
            </DialogDescription>
          </DialogHeader>
          
          {detailScore && (
            <div className="space-y-4">
              {/* Score Summary */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(detailScore.score)}`}>
                    {detailScore.score}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conditions Met</p>
                  <p className="text-3xl font-bold">
                    {detailScore.conditions.filter(c => c.met).length}/{detailScore.conditions.length}
                  </p>
                </div>
              </div>

              {/* Narrative */}
              <div className="p-4 bg-secondary rounded-lg border border-border">
                <p className="text-sm font-medium mb-2">Analysis Summary</p>
                <p className="text-sm text-muted-foreground">{detailScore.narrative}</p>
              </div>

              {/* Conditions Breakdown */}
              <div>
                <p className="text-sm font-medium mb-3">Conditions Breakdown</p>
                <div className="space-y-2">
                  {detailScore.conditions.map((condition, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        condition.met
                          ? 'bg-success/10 border-success/30'
                          : 'bg-muted border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{condition.label}</p>
                          {condition.value && (
                            <p className="text-xs text-muted-foreground mt-1">{condition.value}</p>
                          )}
                        </div>
                        <Badge variant={condition.met ? 'default' : 'outline'} className="ml-2">
                          {condition.met ? 'Met' : 'Not Met'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
