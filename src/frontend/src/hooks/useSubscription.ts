import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { 
  StripeConfiguration, 
  StripeConfigurationPublic, 
  StripeSessionStatus,
  Subscription,
  PaymentTransaction,
  PaymentMethod,
  TelegramPostResult,
  TelegramPostLog,
  AdminAuditEntry,
  UserProfile
} from '@/backend';
import { PlanType } from '@/backend';

// Admin status check with localStorage caching and creator recognition
export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) {
        console.log('🔒 No actor available for admin check');
        return false;
      }

      if (!identity) {
        console.log('🔒 No identity available for admin check');
        return false;
      }

      const principalText = identity.getPrincipal().toString();
      console.log('🔍 Checking admin status for principal:', principalText);

      try {
        const isAdmin = await actor.isCallerAdmin();
        console.log('✅ Admin status from backend:', isAdmin);
        
        // Cache admin status in localStorage with principal-specific key for persistence
        if (isAdmin) {
          localStorage.setItem(`crypto_collie_admin_${principalText}`, 'true');
          console.log('💾 Creator status cached in localStorage for principal:', principalText);
        } else {
          // Remove cache if not admin
          localStorage.removeItem(`crypto_collie_admin_${principalText}`);
        }
        
        return isAdmin;
      } catch (error) {
        console.error('❌ Error checking admin status:', error);
        // Check localStorage as fallback for creator recognition
        const cachedAdmin = localStorage.getItem(`crypto_collie_admin_${principalText}`) === 'true';
        console.log('📦 Using cached creator status from localStorage:', cachedAdmin);
        return cachedAdmin;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

// Subscription status hook with creator bypass
export function useSubscriptionStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<{
    isActive: boolean;
    isAdmin: boolean;
    planType?: 'weekly' | 'lifetime';
    expiresAt?: bigint;
  }>({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      if (!actor) {
        return { isActive: false, isAdmin: false };
      }

      try {
        // Check admin status first (creator always has admin status)
        const isAdmin = await actor.isCallerAdmin();
        console.log('👑 Admin/Creator status in subscription check:', isAdmin);

        // Creator/Admin always has active subscription
        if (isAdmin) {
          return { isActive: true, isAdmin: true };
        }

        // Check regular subscription for non-admin users
        const subscription = await actor.getSubscription();

        if (!subscription) {
          return { isActive: false, isAdmin: false };
        }

        const isActive = subscription.status.__kind__ === 'active';
        const expiresAt = subscription.status.__kind__ === 'active' 
          ? subscription.status.active.expiresAt 
          : undefined;

        return {
          isActive,
          isAdmin: false,
          planType: subscription.planType,
          expiresAt,
        };
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        return { isActive: false, isAdmin: false };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: 2,
  });
}

// User profile hooks
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  // Return custom state that properly reflects actor dependency
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stripe configuration hooks
export function useStripeConfiguration() {
  const { actor, isFetching } = useActor();

  return useQuery<StripeConfigurationPublic>({
    queryKey: ['stripeConfiguration'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeConfiguration();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

export function useSaveStripeConfiguration() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfiguration'] });
    },
  });
}

// Payment creation hooks
export function useCreateStripePayment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ planType }: { planType: PlanType }): Promise<{ url: string }> => {
      if (!actor) throw new Error('Actor not available');
      
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success?plan=${planType}`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      
      const items = [
        {
          productName: planType === PlanType.weekly ? 'Plano Semanal' : 'Passe Vitalício',
          productDescription: planType === PlanType.weekly 
            ? 'Acesso premium por 7 dias' 
            : 'Acesso premium vitalício',
          priceInCents: BigInt(planType === PlanType.weekly ? 100 : 5000),
          currency: 'usd',
          quantity: BigInt(1),
        },
      ];
      
      const sessionJson = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(sessionJson);
      return { url: session.url };
    },
  });
}

export function useCreateIcpPayment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ planType }: { planType: PlanType }): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.createIcpPayment(planType);
    },
  });
}

export function useCreateStablecoinPayment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ planType }: { planType: PlanType }): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStablecoinPayment(planType);
    },
  });
}

// Telegram hooks
export function useSendTelegramPost() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (message: string): Promise<TelegramPostResult> => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendTelegramPost(message);
    },
  });
}

export function useGetTelegramPostLog(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<TelegramPostLog[]>({
    queryKey: ['telegramPostLog', limit],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTelegramPostLog(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    retry: 2,
  });
}

export function useGetAdminAuditLog(limit: number = 20) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminAuditEntry[]>({
    queryKey: ['adminAuditLog', limit],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminAuditLog(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    retry: 2,
  });
}

// Subscription hooks
export function useGetSubscription() {
  const { actor, isFetching } = useActor();

  return useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubscription();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

export function useActivateSubscription() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ planType, paymentId }: { planType: PlanType; paymentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.activateSubscription(planType, paymentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['hasPremiumAccess'] });
    },
  });
}

export function useHasPremiumAccess() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['hasPremiumAccess'],
    queryFn: async () => {
      if (!actor || !identity) return false;
      const userPrincipal = identity.getPrincipal();
      return actor.hasPremiumAccess(userPrincipal);
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: 2,
  });
}

export function useRecordPaymentTransaction() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (transaction: PaymentTransaction) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordPaymentTransaction(transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sessionId: string): Promise<StripeSessionStatus> => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeSessionStatus(sessionId);
    },
  });
}

// Alias for backward compatibility
export const useCheckStripeSessionStatus = useGetStripeSessionStatus;
