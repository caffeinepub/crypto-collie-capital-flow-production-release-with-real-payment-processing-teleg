import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  useIsAdmin, 
  useStripeConfiguration, 
  useSaveStripeConfiguration,
  useSendTelegramPost,
  useGetTelegramPostLog
} from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Eye, EyeOff, Save, CheckCircle2, Send, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import RouteLoading from '@/components/RouteLoading';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { data: stripeConfig, isLoading: isLoadingConfig } = useStripeConfiguration();
  const { data: telegramPostLog } = useGetTelegramPostLog(10);
  const saveConfig = useSaveStripeConfiguration();
  const sendTelegramPost = useSendTelegramPost();

  const [secretKey, setSecretKey] = useState('');
  const [allowedCountries, setAllowedCountries] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    if (stripeConfig && stripeConfig.isConfigured) {
      setAllowedCountries(stripeConfig.allowedCountries.join(','));
    }
  }, [stripeConfig]);

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast.error('Erro: Chave secreta do Stripe é obrigatória');
      return;
    }

    if (!secretKey.startsWith('sk_live_') && !secretKey.startsWith('sk_test_')) {
      toast.error('Erro: Chave secreta deve começar com sk_live_ ou sk_test_');
      return;
    }

    if (!allowedCountries.trim()) {
      toast.error('Erro: Países permitidos são obrigatórios');
      return;
    }

    const countries = allowedCountries
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0);

    if (countries.length === 0) {
      toast.error('Erro: Pelo menos um país deve ser especificado');
      return;
    }

    const invalidCountries = countries.filter(c => c.length !== 2 || !/^[A-Z]{2}$/.test(c));
    if (invalidCountries.length > 0) {
      toast.error(`Erro: Códigos de país inválidos: ${invalidCountries.join(', ')}`);
      return;
    }

    try {
      await saveConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countries,
      });

      toast.success('✅ Configuração salva com sucesso! Stripe ativado.');
      setSecretKey('');
      setShowSecretKey(false);
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error(`❌ Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleTestTelegramPost = async () => {
    try {
      const testMessage = `🤖 <b>Teste do Bot Crypto Collie</b>\n\nEsta é uma mensagem de teste do sistema de postagens automatizadas.\n\n✅ Bot configurado e funcionando corretamente!`;
      
      const result = await sendTelegramPost.mutateAsync(testMessage);
      
      if (result.isSuccess) {
        toast.success('✅ Mensagem de teste enviada com sucesso!');
      } else {
        toast.error(`❌ Falha ao enviar mensagem: ${result.resultMessage}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erro ao enviar mensagem de teste: ${error.message}`);
    }
  };

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingAdmin || isLoadingConfig) {
    return <RouteLoading />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-destructive" />
              <CardTitle className="text-destructive">Acesso Restrito</CardTitle>
            </div>
            <CardDescription>
              Esta página é acessível apenas para o criador do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/' })} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl space-y-6">
      <Button onClick={() => navigate({ to: '/' })} variant="ghost">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao Dashboard
      </Button>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Painel do Criador</AlertTitle>
        <AlertDescription>
          Você está autenticado como o criador permanente deste sistema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Stripe</CardTitle>
          <CardDescription>Configure o Stripe para processar pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {stripeConfig?.isConfigured && (
            <Alert className="mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Stripe Configurado</AlertTitle>
              <AlertDescription>
                Países: {stripeConfig.allowedCountries.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleStripeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secretKey">Chave Secreta do Stripe</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="sk_live_..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedCountries">Países Permitidos</Label>
              <Input
                id="allowedCountries"
                value={allowedCountries}
                onChange={(e) => setAllowedCountries(e.target.value)}
                placeholder="BR,US,PT"
                required
              />
              <p className="text-xs text-muted-foreground">
                Códigos ISO de 2 letras separados por vírgula
              </p>
            </div>

            <Button type="submit" disabled={saveConfig.isPending} className="w-full">
              {saveConfig.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Bot Telegram</CardTitle>
          <CardDescription>Sistema de postagens automatizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Bot Pré-Configurado</AlertTitle>
            <AlertDescription>
              O bot está pronto para enviar postagens automatizadas
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleTestTelegramPost}
            disabled={sendTelegramPost.isPending}
            variant="outline"
            className="w-full"
          >
            {sendTelegramPost.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem de Teste
              </>
            )}
          </Button>

          {telegramPostLog && telegramPostLog.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Histórico de Envios</AlertTitle>
              <AlertDescription>
                <ScrollArea className="h-64 w-full mt-2">
                  <div className="space-y-2">
                    {telegramPostLog.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border text-xs ${
                          log.success ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {log.success ? (
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                            )}
                            <span className="truncate">{log.messagePreview}</span>
                          </div>
                          <span className="text-muted-foreground shrink-0">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
