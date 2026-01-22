
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSecureAction } from './useSecureAction';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string | null;
  type: string;
  status: string;
  payment_method: string | null;
  user_id: string;
  created_at: string;
}

export interface TransactionFormData {
  id?: string;
  description: string;
  amount: number;
  category_id: string | null;
  type: string;
  date: string;
  payment_method: string | null;
  status: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const { executeSecurely } = useSecureAction();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions((data as unknown as Transaction[]) || []);
    } catch (err: any) {
      console.error('Erro ao buscar transações:', err);
      setError(err.message);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time subscription for cross-tab sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTransaction = payload.new as Transaction;
            setTransactions(prev => {
              // Check if already exists (from optimistic update)
              if (prev.some(t => t.id === newTransaction.id)) return prev;
              const updated = [newTransaction, ...prev];
              return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTransaction = payload.new as Transaction;
            setTransactions(prev =>
              prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTransactions(prev => prev.filter(t => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTransaction = async (transactionData: TransactionFormData) => {
    if (!user) return null;
    
    // Create optimistic transaction with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticTransaction: Transaction = {
      id: tempId,
      description: transactionData.description,
      amount: transactionData.amount,
      category_id: transactionData.category_id,
      type: transactionData.type,
      date: transactionData.date,
      payment_method: transactionData.payment_method,
      status: transactionData.status,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    // Optimistic update - add immediately to UI
    setTransactions(prev => {
      const updated = [optimisticTransaction, ...prev];
      // Sort by date descending
      return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    const result = await executeSecurely(
      { 
        endpoint: 'transactions/create', 
        action: 'transaction_create', 
        resource: 'transaction',
        maxRequests: 30,
        windowMinutes: 1 
      },
      async () => {
        const newTransaction = {
          description: transactionData.description,
          amount: transactionData.amount,
          category_id: transactionData.category_id,
          type: transactionData.type,
          date: transactionData.date,
          payment_method: transactionData.payment_method,
          status: transactionData.status,
          user_id: user.id
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert([newTransaction] as any)
          .select();

        if (error) throw error;
        
        // Replace optimistic transaction with real one
        const realTransaction = data[0] as unknown as Transaction;
        setTransactions(prev => 
          prev.map(t => t.id === tempId ? realTransaction : t)
        );

        toast.success('Transação criada com sucesso!');
        return realTransaction;
      },
      { transactionType: transactionData.type, amount: transactionData.amount }
    );

    if (result === null) {
      // Rate limited or error - rollback optimistic update
      setTransactions(prev => prev.filter(t => t.id !== tempId));
    }

    return result;
  };

  const updateTransaction = async (id: string, transactionData: Partial<TransactionFormData>) => {
    if (!user) return false;
    
    // Store previous state for rollback
    const previousTransactions = [...transactions];
    
    // Optimistic update
    setTransactions(prev => 
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            ...(transactionData.description !== undefined && { description: transactionData.description }),
            ...(transactionData.amount !== undefined && { amount: transactionData.amount }),
            ...(transactionData.category_id !== undefined && { category_id: transactionData.category_id }),
            ...(transactionData.type !== undefined && { type: transactionData.type }),
            ...(transactionData.date !== undefined && { date: transactionData.date }),
            ...(transactionData.payment_method !== undefined && { payment_method: transactionData.payment_method }),
            ...(transactionData.status !== undefined && { status: transactionData.status }),
          };
        }
        return t;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );

    const result = await executeSecurely(
      { 
        endpoint: 'transactions/update', 
        action: 'transaction_update', 
        resource: 'transaction',
        maxRequests: 30,
        windowMinutes: 1 
      },
      async () => {
        const updateData: { 
          description?: string;
          amount?: number;
          category_id?: string | null;
          type?: string;
          date?: string;
          payment_method?: string | null;
          status?: string;
        } = {};
        
        if (transactionData.description !== undefined) updateData.description = transactionData.description;
        if (transactionData.amount !== undefined) updateData.amount = transactionData.amount;
        if (transactionData.category_id !== undefined) updateData.category_id = transactionData.category_id;
        if (transactionData.type !== undefined) updateData.type = transactionData.type;
        if (transactionData.date !== undefined) updateData.date = transactionData.date;
        if (transactionData.payment_method !== undefined) updateData.payment_method = transactionData.payment_method;
        if (transactionData.status !== undefined) updateData.status = transactionData.status;

        const { error } = await supabase
          .from('transactions')
          .update(updateData as any)
          .eq('id', id as any);

        if (error) throw error;
        
        toast.success('Transação atualizada com sucesso!');
        return true;
      },
      { transactionId: id }
    );

    if (result === null) {
      // Rollback on rate limit or error
      setTransactions(previousTransactions);
      return false;
    }

    return result;
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return false;
    
    // Store previous state for rollback
    const previousTransactions = [...transactions];
    
    // Optimistic update - remove immediately
    setTransactions(prev => prev.filter(t => t.id !== id));

    const result = await executeSecurely(
      { 
        endpoint: 'transactions/delete', 
        action: 'transaction_delete', 
        resource: 'transaction',
        maxRequests: 20,
        windowMinutes: 1 
      },
      async () => {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id as any);

        if (error) throw error;
        
        toast.success('Transação excluída com sucesso!');
        return true;
      },
      { transactionId: id }
    );

    if (result === null) {
      // Rollback on rate limit or error
      setTransactions(previousTransactions);
      return false;
    }

    return result;
  };

  const exportTransactions = async (format: 'csv' | 'json' = 'csv') => {
    if (!transactions.length) {
      toast.error('Não há transações para exportar');
      return;
    }

    await executeSecurely(
      { 
        endpoint: 'transactions/export', 
        action: 'export_data', 
        resource: 'transactions',
        maxRequests: 5,
        windowMinutes: 1 
      },
      async () => {
        if (format === 'csv') {
          const headers = ['Data', 'Descrição', 'Valor', 'Categoria', 'Tipo', 'Status', 'Método de Pagamento'];
          const csvRows = [headers.join(',')];
          
          transactions.forEach(t => {
            const row = [
              t.date,
              `"${t.description.replace(/"/g, '""')}"`,
              t.amount,
              t.category_id || '',
              t.type,
              t.status,
              t.payment_method || ''
            ];
            csvRows.push(row.join(','));
          });
          
          const csvString = csvRows.join('\n');
          const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.setAttribute('href', url);
          link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Transações exportadas com sucesso!');
        } else {
          const dataStr = JSON.stringify(transactions, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.setAttribute('href', url);
          link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.json`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Transações exportadas com sucesso!');
        }
        return true;
      },
      { format, transactionCount: transactions.length }
    );
  };

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions
  };
}
