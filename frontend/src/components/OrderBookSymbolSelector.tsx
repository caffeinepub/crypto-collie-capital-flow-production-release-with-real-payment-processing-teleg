import { useAssetSelector } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import SearchableAssetSelector from './SearchableAssetSelector';

interface OrderBookSymbolSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
}

export default function OrderBookSymbolSelector({ value, onChange }: OrderBookSymbolSelectorProps) {
  const { data: symbols, isLoading } = useAssetSelector();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <SearchableAssetSelector
      value={value}
      onChange={onChange}
      symbols={symbols || []}
      placeholder="Escolha um símbolo..."
      label="Selecionar Símbolo"
    />
  );
}
