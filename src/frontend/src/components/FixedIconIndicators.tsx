import { Crown, User, Bell, CheckCircle2 } from 'lucide-react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useSubscriptionStatus } from '@/hooks/useSubscription';
import { useGetCallerUserProfile } from '@/hooks/useSubscription';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from '@tanstack/react-router';

export default function FixedIconIndicators() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;

  // Don't show anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const showProfileSetupIndicator = isAuthenticated && !profileLoading && userProfile === null;
  const showSubscriptionIndicator = isAuthenticated && !isLoadingSubscription && !subscriptionStatus?.isActive && !subscriptionStatus?.isAdmin;

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 pointer-events-none">
        {/* Profile Setup Indicator */}
        {showProfileSetupIndicator && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate({ to: '/admin-settings' })}
                className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform duration-200 animate-pulse"
                aria-label="Complete seu perfil"
              >
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-zinc-900 border-cyan-500/30 text-white">
              <p className="font-semibold">Complete seu perfil</p>
              <p className="text-xs text-zinc-400">Clique para configurar</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Subscription Indicator */}
        {showSubscriptionIndicator && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate({ to: '/admin-settings' })}
                className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/30 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                aria-label="Ativar Premium"
              >
                <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-zinc-900 border-yellow-500/30 text-white">
              <p className="font-semibold">Ativar Premium</p>
              <p className="text-xs text-zinc-400">Acesso completo disponível</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Active Subscription Indicator */}
        {isAuthenticated && !isLoadingSubscription && subscriptionStatus?.isActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-zinc-900 border-emerald-500/30 text-white">
              <p className="font-semibold">Premium Ativo</p>
              <p className="text-xs text-zinc-400">
                {subscriptionStatus.planType === 'lifetime' ? 'Vitalício' : 'Semanal'}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Notification Bell (placeholder for future notifications) */}
        {isAuthenticated && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted border-2 border-border shadow-md flex items-center justify-center hover:scale-105 transition-transform duration-200 opacity-50 hover:opacity-100"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-zinc-900 border-border text-white">
              <p className="font-semibold">Notificações</p>
              <p className="text-xs text-zinc-400">Nenhuma nova notificação</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
