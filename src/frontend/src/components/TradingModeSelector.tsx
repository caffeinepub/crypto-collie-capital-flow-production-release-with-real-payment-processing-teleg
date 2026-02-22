import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type TradingMode = 'Day Trade' | 'Swing Trade' | 'Scalping' | 'Position Trading';

interface TradingModeSelectorProps {
  selectedMode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
}

const tradingModes: Array<{
  id: TradingMode;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: 'Day Trade',
    label: 'Day Trade',
    icon: '/assets/generated/day-trade-icon.dim_64x64.png',
    description: 'Operações intradiárias',
  },
  {
    id: 'Swing Trade',
    label: 'Swing Trade',
    icon: '/assets/generated/swing-trade-icon.dim_64x64.png',
    description: 'Operações de médio prazo',
  },
  {
    id: 'Scalping',
    label: 'Scalping',
    icon: '/assets/generated/scalping-icon.dim_64x64.png',
    description: 'Operações ultra-rápidas',
  },
  {
    id: 'Position Trading',
    label: 'Position Trading',
    icon: '/assets/generated/position-trade-icon.dim_64x64.png',
    description: 'Operações de longo prazo',
  },
];

export default function TradingModeSelector({ selectedMode, onModeChange }: TradingModeSelectorProps) {
  return (
    <Card className="border border-border">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Modo de Trading</h3>
          <div className="flex flex-wrap gap-4">
            {tradingModes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <Button
                  key={mode.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onModeChange(mode.id)}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-6 transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50 border-2 border-primary'
                      : 'bg-card hover:bg-muted border border-border'
                  }`}
                >
                  <img
                    src={mode.icon}
                    alt={mode.label}
                    className={`w-12 h-12 object-contain transition-all ${
                      isSelected ? 'brightness-0 invert' : 'opacity-70'
                    }`}
                  />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p className="text-xs opacity-80">{mode.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
