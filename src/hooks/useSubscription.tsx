import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubscriptionPlan {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    stripe_price_id_monthly: string | null;
    stripe_price_id_yearly: string | null;

    max_transactions_per_month: number;
    max_connected_accounts: number;
    max_forecasts_per_month: number;
    max_recurring_transactions: number;

    has_open_finance: boolean;
    has_advanced_analytics: boolean;
    has_ai_insights: boolean;
    has_priority_support: boolean;
    has_export_reports: boolean;
    has_api_access: boolean;

    sort_order: number;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    plan_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    stripe_current_period_start: string | null;
    stripe_current_period_end: string | null;
    stripe_cancel_at_period_end: boolean;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    billing_cycle: 'monthly' | 'yearly';
    trial_ends_at: string | null;
    transactions_used_this_month: number;
    forecasts_used_this_month: number;
    created_at: string;
    updated_at: string;
}

export function useSubscription() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
        queryKey: ['subscription-plans'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;
            return data as SubscriptionPlan[];
        },
    });

    const { data: subscription, isLoading: isLoadingSubscription } = useQuery<UserSubscription & { plan: SubscriptionPlan }>({
        queryKey: ['user-subscription', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('user_subscriptions')
                .select(`
                    *,
                    plan:subscription_plans(*)
                `)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data as any;
        },
        enabled: !!user,
    });

    const checkFeatureAccess = async (featureName: string): Promise<boolean> => {
        if (!user) return false;

        const { data, error } = await supabase.rpc('check_feature_access', {
            p_user_id: user.id,
            p_feature_name: featureName,
        });

        if (error) {
            console.error('Error checking feature access:', error);
            return false;
        }

        return data as boolean;
    };

    const checkUsageLimit = async (limitType: string) => {
        if (!user) return { has_access: false, limit: 0, used: 0, remaining: 0 };

        const { data, error } = await supabase.rpc('check_usage_limit', {
            p_user_id: user.id,
            p_limit_type: limitType,
        });

        if (error) {
            console.error('Error checking usage limit:', error);
            return { has_access: false, limit: 0, used: 0, remaining: 0 };
        }

        return data as any;
    };

    const createCheckoutMutation = useMutation({
        mutationFn: async ({ priceId, billingCycle }: { priceId: string; billingCycle: 'monthly' | 'yearly' }) => {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId, billingCycle },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {

            if (data.url) {
                window.location.href = data.url;
            }
        },
        onError: (error: any) => {
            toast.error(`Erro ao criar sessão: ${error.message}`);
        },
    });

    const openCustomerPortalMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('create-customer-portal');

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url;
            }
        },
        onError: (error: any) => {
            toast.error(`Erro ao abrir portal: ${error.message}`);
        },
    });

    return {
        plans: plans || [],
        subscription,
        currentPlan: subscription?.plan,
        isLoading: isLoadingPlans || isLoadingSubscription,
        checkFeatureAccess,
        checkUsageLimit,
        createCheckout: createCheckoutMutation.mutate,
        isCreatingCheckout: createCheckoutMutation.isPending,
        openCustomerPortal: openCustomerPortalMutation.mutate,
        isOpeningPortal: openCustomerPortalMutation.isPending,
    };
}