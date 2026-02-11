import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, Crown, Shield, Settings, User } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscription';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  
  const isAuthenticated = !!identity;
  const isAdmin = subscriptionStatus?.isAdmin || false;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      
      if (identity) {
        const principalText = identity.getPrincipal().toString();
        localStorage.removeItem(`crypto_collie_admin_${principalText}`);
        localStorage.removeItem(`crypto_collie_admin_initialized_${principalText}`);
      }
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const getSubscriptionBadge = () => {
    if (!isAuthenticated || isLoadingSubscription) return null;
    
    if (isAdmin) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Criador</span>
        </div>
      );
    }
    
    if (subscriptionStatus?.isActive) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
          <Crown className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-accent">
            {subscriptionStatus.planType === 'lifetime' ? 'Vitalício' : 'Premium'}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border">
        <span className="text-xs text-muted-foreground">Gratuito</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="shrink-0 p-2 rounded-xl bg-primary/10 border border-primary/20">
              <img 
                src="/assets/generated/crypto-collie-pwa-96.png" 
                alt="Crypto Collie" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                Crypto Collie
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Análise de Fluxo de Capital
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {getSubscriptionBadge()}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate({ to: '/admin-settings' })}
                        className="cursor-pointer"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleAuth} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleAuth} disabled={isLoggingIn} size="sm">
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
