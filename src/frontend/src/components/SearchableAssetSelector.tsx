import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SearchableAssetSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
  symbols: string[];
  placeholder?: string;
  label?: string;
}

export default function SearchableAssetSelector({
  value,
  onChange,
  symbols,
  placeholder = 'Escolha um símbolo...',
  label = 'Selecionar Símbolo',
}: SearchableAssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Filter symbols based on search term
  const filteredSymbols = symbols.filter((symbol) =>
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle symbol selection
  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setOpen(false);
    setSearchTerm('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow normal text editing keys
    if (
      e.key === 'Escape' ||
      e.key === 'Tab'
    ) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearchTerm('');
      }
      return;
    }

    // Stop propagation for text editing keys to prevent dropdown interference
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      e.stopPropagation();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-card text-card-foreground border border-border hover:bg-secondary hover:border-primary transition-colors"
          >
            <span className={cn(
              "truncate",
              !value && "text-muted-foreground"
            )}>
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border shadow-xl z-[100]"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <div className="flex items-center border-b border-border bg-muted px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar símbolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {filteredSymbols.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum símbolo encontrado.
                </div>
              ) : (
                filteredSymbols.slice(0, 100).map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleSelect(symbol)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      value === symbol && "bg-secondary text-primary font-medium"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === symbol ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 text-left">{symbol}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
