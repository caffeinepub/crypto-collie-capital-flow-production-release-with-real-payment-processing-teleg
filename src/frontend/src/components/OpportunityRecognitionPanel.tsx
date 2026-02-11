// Opportunity Recognition Panel with multi-strategy ranking

import { useState } from 'react';
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

interface OpportunityRecognitionPanelProps {
  onSelectSymbol?: (symbol: string) => void;
}

export default function OpportunityRecognitionPanel({ onSelectSymbol }: OpportunityRecognitionPanelProps) {
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
              <SelectTrigger id="modality-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
                  <Badge key={tfId} variant="outline" className="text-xs">
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
          ) : !rankings || rankings.length === 0 ? (
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
                  {rankings.map((score, index) => {
                    const metConditions = score.conditions.filter(c => c.met).length;
                    const totalConditions = score.conditions.length;

                    return (
                      <TableRow
                        key={score.symbol}
                        className="cursor-pointer hover:bg-muted/50"
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailScore?.symbol}
              <Badge variant={detailScore ? getScoreBadgeVariant(detailScore.score) : 'outline'}>
                Score: {detailScore?.score}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {STRATEGY_MODALITIES.find(m => m.id === selectedModality)?.label} strategy analysis
            </DialogDescription>
          </DialogHeader>

          {detailScore && (
            <div className="space-y-4">
              {/* Timeframes */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Timeframes Analyzed</h4>
                <div className="flex flex-wrap gap-2">
                  {detailScore.timeframes.map(tf => (
                    <Badge key={tf} variant="outline" className="text-xs">
                      {tf}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Narrative */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Analysis</h4>
                <p className="text-sm text-muted-foreground">{detailScore.narrative}</p>
              </div>

              {/* Conditions Breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Conditions Breakdown</h4>
                <div className="space-y-2">
                  {detailScore.conditions.map(condition => (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            condition.met ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="text-sm">{condition.label}</span>
                      </div>
                      {condition.value && (
                        <Badge variant="outline" className="text-xs">
                          {condition.value}
                        </Badge>
                      )}
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
