import { useState } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { 
  useCreateStripePayment, 
  useCreateIcpPayment, 
  useCreateStablecoinPayment 
} from '@/hooks/useSubscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, CreditCard, Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PlanType, PaymentMethod } from '@/backend';
import PaymentConfirmationModal from './PaymentConfirmationModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { identity, login } = useInternetIdentity();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.weekly);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.stripe);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);

  const { mutate: createStripePayment, isPending: isStripeLoading } = useCreateStripePayment();
  const { mutate: createIcpPayment, isPending: isIcpLoading } = useCreateIcpPayment();
  const { mutate: createStablecoinPayment, isPending: isStablecoinLoading } = useCreateStablecoinPayment();

  const isAuthenticated = !!identity;
  const isPending = isStripeLoading || isIcpLoading || isStablecoinLoading;

  const plans = [
    {
      id: PlanType.weekly,
      name: 'Plano Semanal',
      price: 1,
      period: 'semana',
      icon: Zap,
      features: [
        'Acesso completo por 7 dias',
        'Dados em tempo real',
        'Análises avançadas',
        'Recomendações inteligentes',
        'Suporte prioritário',
      ],
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      id: PlanType.lifetime,
      name: 'Passe Vitalício',
      price: 50,
      period: 'único',
      icon: Crown,
      features: [
        'Acesso vitalício ilimitado',
        'Todos os recursos premium',
        'Atualizações futuras incluídas',
        'Suporte VIP prioritário',
        'Economia de 98% no longo prazo',
      ],
      gradient: 'from-yellow-500 to-orange-500',
      badge: 'Promoção Inicial',
    },
  ];

  const paymentMethods = [
    {
      id: PaymentMethod.stripe,
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Visa, Mastercard, Amex',
    },
    {
      id: PaymentMethod.icp,
      name: 'ICP Token',
      icon: Coins,
      description: 'Token nativo do IC',
    },
    {
      id: PaymentMethod.stablecoin,
      name: 'Stablecoins USD',
      icon: Coins,
      description: 'USDT, USDC',
    },
  ];

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Por favor, faça login primeiro');
      login();
      return;
    }

    const planType = selectedPlan;

    if (selectedPayment === PaymentMethod.stripe) {
      createStripePayment(
        { planType },
        {
          onSuccess: (result) => {
            window.location.href = result.url;
          },
          onError: (error: any) => {
            setPaymentResult({
              success: false,
              message: error.message || 'Erro ao processar pagamento com cartão de crédito',
            });
            setShowConfirmation(true);
          },
        }
      );
    } else if (selectedPayment === PaymentMethod.icp) {
      createIcpPayment(
        { planType },
        {
          onSuccess: (icpAmount) => {
            setPaymentResult({
              success: true,
              message: `Pagamento ICP iniciado. Valor: ${icpAmount} ICP. Complete a transferência para ativar sua assinatura.`,
            });
            setShowConfirmation(true);
          },
          onError: (error: any) => {
            setPaymentResult({
              success: false,
              message: error.message || 'Erro ao processar pagamento com ICP',
            });
            setShowConfirmation(true);
          },
        }
      );
    } else if (selectedPayment === PaymentMethod.stablecoin) {
      createStablecoinPayment(
        { planType },
        {
          onSuccess: (amount) => {
            setPaymentResult({
              success: true,
              message: `Pagamento stablecoin iniciado. Valor: ${amount} USD. Complete a transferência para ativar sua assinatura.`,
            });
            setShowConfirmation(true);
          },
          onError: (error: any) => {
            setPaymentResult({
              success: false,
              message: error.message || 'Erro ao processar pagamento com stablecoin',
            });
            setShowConfirmation(true);
          },
        }
      );
    }
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Escolha seu Plano Premium
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Desbloqueie acesso completo a todas as funcionalidades e dados em tempo real
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === plan.id;
                
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${plan.gradient} shadow-lg shadow-cyan-500/20`
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-cyan-500/30'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white">
                        {plan.badge}
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
                          <h3 className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-cyan-300'}`}>
                            {plan.name}
                          </h3>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-cyan-400'}`}>
                            US$ {plan.price}
                          </span>
                          <span className={`text-sm ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
                            /{plan.period}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                          <Check className="w-4 h-4 text-cyan-600" />
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
                          <span className={`text-sm ${isSelected ? 'text-white/90' : 'text-zinc-300'}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-300 mb-3">Método de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPayment === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-zinc-700 bg-zinc-800/50 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-zinc-400'}`} />
                        <span className={`font-semibold ${isSelected ? 'text-cyan-300' : 'text-zinc-300'}`}>
                          {method.name}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{method.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
              <div className="text-sm text-zinc-400">
                Total: <span className="text-xl font-bold text-cyan-400">US$ {selectedPlanData?.price}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubscribe}
                  disabled={isPending || !isAuthenticated}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processando pagamento...
                    </>
                  ) : (
                    <>
                      {!isAuthenticated ? 'Fazer Login' : 'Confirmar Pagamento'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showConfirmation && paymentResult && (
        <PaymentConfirmationModal
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            if (paymentResult.success) {
              onClose();
            }
          }}
          success={paymentResult.success}
          message={paymentResult.message}
        />
      )}
    </>
  );
}
