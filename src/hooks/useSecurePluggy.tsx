import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { secureData } from '@/lib/secureEncryption';
import { useEffect } from 'react';

export interface SecureConnectedAccount {
    id: string;
    user_id: string;
    connector_id: string;
    connector_name: string;
    status: 'active' | 'disconnected' | 'error';
    sync_status: 'syncing' | 'updated' | 'outdated' | 'login_error' | 'waiting';
    last_sync_at: string | null;
    access_count: number;
    last_accessed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SecureBankAccount {
    id: string;
    user_id: string;
    connected_account_id: string;
    account_type: string;
    account_subtype: string;
    masked_number: string;
    balance: number;
    available_balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

export function useSecurePluggy() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user) {
            secureData.initializeUserKey(user.id);
        }

        return () => {
            if (user) {
                secureData.clearUserKey(user.id);
            }
        };
    }, [user]);

    const { data: connectedAccounts, isLoading: isLoadingAccounts } = useQuery<SecureConnectedAccount[]>({
        queryKey: ['secure-connected-accounts', user?.id],
        queryFn: async () => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('connected_accounts_metadata')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []) as SecureConnectedAccount[];
        },
        enabled: !!user,
    });

    const { data: accounts, isLoading: isLoadingBankAccounts } = useQuery<SecureBankAccount[]>({
        queryKey: ['secure-bank-accounts', user?.id],
        queryFn: async () => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('accounts')
                .select(`
          id,
          user_id,
          connected_account_id,
          account_type,
          account_subtype,
          encrypted_balance,
          encrypted_available_balance,
          encrypted_account_number,
          currency,
          created_at,
          updated_at
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!secureData.isKeyInitialized()) {
                await secureData.initializeUserKey(user.id);
            }

            const decryptedAccounts = (data || []).map((account: any) => {
                try {
                    const balance = account.encrypted_balance
                        ? secureData.decryptBalance(account.encrypted_balance)
                        : 0;

                    const availableBalance = account.encrypted_available_balance
                        ? secureData.decryptBalance(account.encrypted_available_balance)
                        : 0;

                    const accountNumber = account.encrypted_account_number
                        ? secureData.decryptAccountNumber(account.encrypted_account_number)
                        : '';

                    return {
                        id: account.id,
                        user_id: account.user_id,
                        connected_account_id: account.connected_account_id,
                        account_type: account.account_type,
                        account_subtype: account.account_subtype,
                        masked_number: secureData.maskAccountNumber(accountNumber),
                        balance,
                        available_balance: availableBalance,
                        currency: account.currency,
                        created_at: account.created_at,
                        updated_at: account.updated_at,
                    } as SecureBankAccount;
                } catch (decryptError) {
                    console.error('[Security] Failed to decrypt account data:', account.id);
                    return null;
                }
            }).filter(Boolean) as SecureBankAccount[];

            return decryptedAccounts;
        },
        enabled: !!user,
    });

    const createConnectTokenMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('pluggy-secure-proxy', {
                body: { action: 'create_connect_token' },
            });

            if (error) throw error;
            return data.accessToken;
        },
        onSuccess: () => {
            toast.success('Token de conexão criado com segurança');
        },
        onError: (error: any) => {
            console.error('[Security] Failed to create connect token');
            toast.error('Erro ao criar token de conexão');
        },
    });

    const syncAccountsMutation = useMutation({
        mutationFn: async (itemId: string) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('pluggy-secure-proxy', {
                body: {
                    action: 'sync_accounts',
                    itemId
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['secure-connected-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['secure-bank-accounts'] });
            toast.success('Contas sincronizadas com segurança');
        },
        onError: (error: any) => {
            console.error('[Security] Failed to sync accounts');
            toast.error('Erro ao sincronizar contas');
        },
    });

    const disconnectAccountMutation = useMutation({
        mutationFn: async (itemId: string) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('pluggy-secure-proxy', {
                body: {
                    action: 'disconnect',
                    itemId
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['secure-connected-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['secure-bank-accounts'] });
            toast.success('Conta desconectada com segurança');
        },
        onError: (error: any) => {
            console.error('[Security] Failed to disconnect account');
            toast.error('Erro ao desconectar conta');
        },
    });

    return {
        connectedAccounts: connectedAccounts || [],
        accounts: accounts || [],
        isLoading: isLoadingAccounts || isLoadingBankAccounts,

        createConnectToken: createConnectTokenMutation.mutate,
        isCreatingToken: createConnectTokenMutation.isPending,

        syncAccounts: syncAccountsMutation.mutate,
        isSyncing: syncAccountsMutation.isPending,

        disconnectAccount: disconnectAccountMutation.mutate,
        isDisconnecting: disconnectAccountMutation.isPending,
    };
}
