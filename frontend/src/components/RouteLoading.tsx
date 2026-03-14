import { Loader2 } from 'lucide-react';

export default function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
