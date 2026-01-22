
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCategories } from './useCategories';
import { useSecureAction } from './useSecureAction';

export interface BudgetCategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  max_amount: number;
  current_amount: number;
  percentage: number;
  color: string;
  period: 'monthly' | 'yearly' | 'weekly';
  created_at: string;
  updated_at: string;
}

export const useBudget = () => {
  const { user } = useAuth();
  const { executeSecurely } = useSecureAction();
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useCategories();

  // Helper function to extract budget limit from color field
  const extractBudgetLimit = (colorField: string | null): number => {
    if (!colorField) return 1000; // Default limit
    
    const parts = colorField.split(':');
    if (parts.length > 1) {
      const limit = parseFloat(parts[1]);
      return isNaN(limit) ? 1000 : limit;
    }
    
    return 1000; // Default limit if no budget info in color
  };

  // Helper function to extract just the color
  const extractColor = (colorField: string | null): string => {
    if (!colorField) return '#3b82f6'; // Default color
    
    const parts = colorField.split(':');
    return parts[0] || '#3b82f6';
  };

  const fetchBudgetCategories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense');

      if (error) throw error;

      // Get transactions to calculate current amounts
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lte('date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

      if (transactionsError) throw transactionsError;

      // Process budget data
      const processedBudgetData = (data as any[] || []).map(category => {
        const categoryTransactions = transactions ? transactions.filter(t => t.category_id === category.id) : [];
        const currentAmount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const maxAmount = extractBudgetLimit(category.color);
        const percentage = Math.min(Math.round((currentAmount / maxAmount) * 100), 100);

        return {
          id: category.id,
          user_id: category.user_id,
          category_id: category.id,
          name: category.name,
          max_amount: maxAmount,
          current_amount: currentAmount,
          percentage,
          color: extractColor(category.color) || '#3b82f6',
          period: 'monthly' as const,
          created_at: category.created_at,
          updated_at: category.updated_at
        };
      });

      setBudgetCategories(processedBudgetData);
    } catch (err: any) {
      console.error('Erro ao buscar categorias de orçamento:', err);
      setError(err.message);
      toast.error('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateBudgetLimit = async (categoryId: string, newLimit: number) => {
    if (!user) return false;

    // Store previous state for rollback
    const previousBudgetCategories = [...budgetCategories];

    // Optimistic update
    setBudgetCategories(prev =>
      prev.map(bc => {
        if (bc.id === categoryId) {
          const percentage = Math.min(Math.round((bc.current_amount / newLimit) * 100), 100);
          return {
            ...bc,
            max_amount: newLimit,
            percentage
          };
        }
        return bc;
      })
    );

    const result = await executeSecurely(
      {
        endpoint: 'budget/update',
        action: 'budget_update',
        resource: 'budget',
        maxRequests: 20,
        windowMinutes: 1
      },
      async () => {
        const { data: categoryData, error: fetchError } = await supabase
          .from('categories')
          .select('color')
          .eq('id', categoryId)
          .eq('user_id', user.id)
          .single();
        
        if (fetchError) throw fetchError;
        
        const currentColor = extractColor(categoryData?.color);
        
        const { error } = await supabase
          .from('categories')
          .update({ 
            color: `${currentColor}:${newLimit}` 
          })
          .eq('id', categoryId)
          .eq('user_id', user.id);

        if (error) throw error;

        toast.success('Limite de orçamento atualizado com sucesso!');
        return true;
      },
      { categoryId, newLimit }
    );

    if (result === null) {
      // Rollback on rate limit or error
      setBudgetCategories(previousBudgetCategories);
      return false;
    }

    return result;
  };

  useEffect(() => {
    fetchBudgetCategories();
  }, [fetchBudgetCategories]);

  // Real-time subscription for cross-tab sync - listen to both categories and transactions
  useEffect(() => {
    if (!user) return;

    const categoriesChannel = supabase
      .channel('budget-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchBudgetCategories();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('budget-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchBudgetCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [user, fetchBudgetCategories]);

  return {
    budgetCategories,
    loading,
    error,
    fetchBudgetCategories,
    updateBudgetLimit
  };
};
