import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecurringTransaction {
    id: string;
    user_id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: string | null;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    next_execution_date: string;
    is_active: boolean;
    created_at: string;
}

export function useRecurringTransactions() {
    const { user } = useAuth();

    const { data, isLoading, error, refetch } = useQuery<RecurringTransaction[]>({
        queryKey: ['recurring-transactions', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('recurring_transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('next_execution_date', { ascending: true });

            if (error) throw error;
            return data as RecurringTransaction[];
        },
        enabled: !!user,
    });

    return {
        data: data || [],
        isLoading,
        error,
        refetch,
    };
}