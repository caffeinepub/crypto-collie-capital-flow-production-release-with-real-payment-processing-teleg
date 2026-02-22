import { useNavigate } from '@tanstack/react-router';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-2 shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/15 border-2 border-destructive/40">
              <XCircle className="w-16 h-16 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-center text-xl font-bold">Pagamento Cancelado</CardTitle>
          <CardDescription className="text-center font-medium">
            Seu pagamento foi cancelado. Você pode tentar novamente ou escolher outro método de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: '/' })} className="w-full font-semibold shadow-lg">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
