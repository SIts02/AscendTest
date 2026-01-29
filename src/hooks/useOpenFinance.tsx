import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ConnectedAccount {
    id: string;
    user_id: string;
    item_id: string;
    connector_id: number;
    connector_name: string;
    status: 'ACTIVE' | 'UPDATING' | 'LOGIN_ERROR' | 'OUTDATED';
    last_sync_at: string | null;
    next_auto_sync_at: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface Account {
    id: string;
    connected_account_id: string;
    user_id: string;
    pluggy_account_id: string;
    type: 'BANK' | 'CREDIT' | 'INVESTMENT';
    subtype: string | null;
    name: string;
    number: string | null;
    balance: number;
    currency_code: string;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export function useOpenFinance() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: connectedAccounts, isLoading: isLoadingConnected } = useQuery<ConnectedAccount[]>({
        queryKey: ['connected-accounts', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('connected_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ConnectedAccount[];
        },
        enabled: !!user,
    });

    const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
        queryKey: ['accounts', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('balance', { ascending: false });

            if (error) throw error;
            return data as Account[];
        },
        enabled: !!user,
    });

    const { data: netWorth, isLoading: isLoadingNetWorth } = useQuery<number>({
        queryKey: ['net-worth', user?.id],
        queryFn: async () => {
            if (!user) return 0;

            const { data, error } = await supabase.rpc('get_net_worth', {
                p_user_id: user.id,
            });

            if (error) throw error;
            return Number(data) || 0;
        },
        enabled: !!user,
    });

    const createPluggyTokenMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase.functions.invoke('create-pluggy-token', {
                headers: {
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
        },
    });

    const deleteConnectedAccountMutation = useMutation({
        mutationFn: async (accountId: string) => {
            const { error } = await supabase
                .from('connected_accounts')
                .delete()
                .eq('id', accountId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Conta desconectada com sucesso');
            queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['net-worth'] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao desconectar: ${error.message}`);
        },
    });

    const syncAccountMutation = useMutation({
        mutationFn: async (itemId: string) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase.functions.invoke('sync-pluggy-account', {
                body: { itemId },
                headers: {
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Sincronização iniciada');

            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['net-worth'] });
            }, 5000);
        },
        onError: (error: any) => {
            toast.error(`Erro na sincronização: ${error.message}`);
        },
    });

    return {
        connectedAccounts: connectedAccounts || [],
        accounts: accounts || [],
        netWorth: netWorth || 0,
        isLoading: isLoadingConnected || isLoadingAccounts || isLoadingNetWorth,
        createPluggyToken: createPluggyTokenMutation.mutate,
        isCreatingToken: createPluggyTokenMutation.isPending,
        deleteConnectedAccount: deleteConnectedAccountMutation.mutate,
        isDeletingAccount: deleteConnectedAccountMutation.isPending,
        syncAccount: syncAccountMutation.mutate,
        isSyncing: syncAccountMutation.isPending,
    };
}