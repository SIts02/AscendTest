import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  template_name: string;
  amount: number;
  description: string;
  category_id: string | null;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  frequency_interval: number;
  start_date: string;
  end_date: string | null;
  next_execution_date: string;
  is_active: boolean;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionTemplate {
  id: string;
  user_id: string;
  name: string;
  amount: number | null;
  description: string;
  category_id: string | null;
  type: 'income' | 'expense';
  payment_method: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CategorizationRule {
  id: string;
  user_id: string;
  rule_name: string;
  keywords: string[];
  category_id: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface UserAlert {
  id: string;
  user_id: string;
  alert_type: 'budget_limit' | 'goal_milestone' | 'unusual_spending' | 'recurring_reminder' | 'custom';
  title: string;
  message: string;
  threshold_value: number | null;
  category_id: string | null;
  is_active: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly' | null;
  last_triggered: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  user_id: string;
  triggered_at: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useAutomation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>([]);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);

  const fetchAutomationData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [
        recurringResult,
        templatesResult,
        rulesResult,
        alertsResult,
        historyResult
      ] = await Promise.all([
        supabase.from('recurring_transactions').select('*').eq('user_id', user.id),
        supabase.from('transaction_templates').select('*').eq('user_id', user.id),
        supabase.from('categorization_rules').select('*').eq('user_id', user.id),
        supabase.from('user_alerts').select('*').eq('user_id', user.id),
        supabase.from('alert_history').select('*').eq('user_id', user.id).order('triggered_at', { ascending: false }).limit(50)
      ]);

      if (recurringResult.data) setRecurringTransactions(recurringResult.data as RecurringTransaction[]);
      if (templatesResult.data) setTemplates(templatesResult.data as TransactionTemplate[]);
      if (rulesResult.data) setCategorizationRules(rulesResult.data as CategorizationRule[]);
      if (alertsResult.data) setAlerts(alertsResult.data as UserAlert[]);
      if (historyResult.data) setAlertHistory(historyResult.data as AlertHistory[]);
    } catch (error) {
      console.error('Error fetching automation data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de automação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecurringTransaction = async (data: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;

      setRecurringTransactions(prev => [...prev, result as RecurringTransaction]);
      toast({
        title: 'Sucesso',
        description: 'Transação recorrente criada com sucesso'
      });
      return result;
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar transação recorrente',
        variant: 'destructive'
      });
    }
  };

  const updateRecurringTransaction = async (id: string, data: Partial<RecurringTransaction>) => {
    try {
      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRecurringTransactions(prev =>
        prev.map(item => item.id === id ? result as RecurringTransaction : item)
      );
      toast({
        title: 'Sucesso',
        description: 'Transação recorrente atualizada'
      });
      return result;
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar transação recorrente',
        variant: 'destructive'
      });
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecurringTransactions(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Transação recorrente removida'
      });
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover transação recorrente',
        variant: 'destructive'
      });
    }
  };

  const createTemplate = async (data: Omit<TransactionTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase
        .from('transaction_templates')
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, result as TransactionTemplate]);
      toast({
        title: 'Sucesso',
        description: 'Template criado com sucesso'
      });
      return result;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar template',
        variant: 'destructive'
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transaction_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Template removido'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover template',
        variant: 'destructive'
      });
    }
  };

  const createCategorizationRule = async (data: Omit<CategorizationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase
        .from('categorization_rules')
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;

      setCategorizationRules(prev => [...prev, result as CategorizationRule]);
      toast({
        title: 'Sucesso',
        description: 'Regra de categorização criada'
      });
      return result;
    } catch (error) {
      console.error('Error creating categorization rule:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar regra',
        variant: 'destructive'
      });
    }
  };

  const deleteCategorizationRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categorization_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategorizationRules(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Regra removida'
      });
    } catch (error) {
      console.error('Error deleting categorization rule:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover regra',
        variant: 'destructive'
      });
    }
  };

  const suggestCategory = (description: string): string | null => {
    const activeRules = categorizationRules
      .filter(rule => rule.is_active)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      for (const keyword of rule.keywords) {
        if (description.toLowerCase().includes(keyword.toLowerCase())) {
          return rule.category_id;
        }
      }
    }
    return null;
  };

  const createAlert = async (data: Omit<UserAlert, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_triggered'>) => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase
        .from('user_alerts')
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;

      setAlerts(prev => [...prev, result as UserAlert]);
      toast({
        title: 'Sucesso',
        description: 'Alerta criado com sucesso'
      });
      return result;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar alerta',
        variant: 'destructive'
      });
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAlerts(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Alerta removido'
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover alerta',
        variant: 'destructive'
      });
    }
  };

  const markAlertAsRead = async (historyId: string) => {
    try {
      const { error } = await supabase
        .from('alert_history')
        .update({ is_read: true })
        .eq('id', historyId);

      if (error) throw error;

      setAlertHistory(prev =>
        prev.map(item => item.id === historyId ? { ...item, is_read: true } : item)
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, [user]);

  return {

    recurringTransactions,
    templates,
    categorizationRules,
    alerts,
    alertHistory,
    loading,

    fetchAutomationData,

    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,

    createTemplate,
    deleteTemplate,

    createCategorizationRule,
    deleteCategorizationRule,
    suggestCategory,

    createAlert,
    deleteAlert,
    markAlertAsRead
  };
};