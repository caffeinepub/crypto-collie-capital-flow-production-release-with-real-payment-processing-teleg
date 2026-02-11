import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useActivateSubscription, useCheckStripeSessionStatus } from '@/hooks/useSubscription';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/backend';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate: activateSubscription } = useActivateSubscription();
  const { mutate: checkSessionStatus } = useCheckStripeSessionStatus();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const planTypeStr = params.get('plan');

    if (!sessionId || !planTypeStr) {
      setError('Informações de pagamento inválidas');
      setIsProcessing(false);
      return;
    }

    const planType = planTypeStr as PlanType;

    checkSessionStatus(sessionId, {
      onSuccess: (status) => {
        if (status.__kind__ === 'completed') {
          activateSubscription(
            { planType, paymentId: sessionId },
            {
              onSuccess: () => setIsProcessing(false),
              onError: (err: any) => {
                setError(err.message || 'Erro ao ativar assinatura');
                setIsProcessing(false);
              },
            }
          );
        } else if (status.__kind__ === 'failed') {
          setError(status.failed.error || 'Pagamento não foi concluído');
          setIsProcessing(false);
        }
      },
      onError: (err: any) => {
        setError(err.message || 'Erro ao verificar status do pagamento');
        setIsProcessing(false);
      },
    });
  }, [activateSubscription, checkSessionStatus]);

  if (isProcessing) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-6 p-8">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <CardTitle>Processando pagamento...</CardTitle>
            <CardDescription className="text-center">
              Aguarde enquanto confirmamos seu pagamento e ativamos sua assinatura premium.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-destructive/10 border border-destructive/30">
                <CheckCircle2 className="w-16 h-16 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-destructive">Erro no Pagamento</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/' })} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-success/10 border border-success/30">
              <CheckCircle2 className="w-16 h-16 text-success" />
            </div>
          </div>
          <CardTitle className="text-center">Pagamento Realizado com Sucesso!</CardTitle>
          <CardDescription className="text-center">
            Sua assinatura premium foi ativada. Agora você tem acesso completo a todas as funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: '/' })} className="w-full">
            Começar a Usar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
