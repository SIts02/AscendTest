import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSecureAction } from './useSecureAction';

export interface ReportTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template_config: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedReport {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  filters: any;
  data_snapshot: any | null;
  file_url: string | null;
  format: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSchedule {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  frequency: string;
  schedule_config: any;
  filters: any;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  transactionTypes: string[];
  amountRange: {
    min: number | null;
    max: number | null;
  };
  paymentMethods: string[];
  description: string;
}

export const useReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeSecurely } = useSecureAction();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);

  // Fetch all reports data
  const fetchReportsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [templatesResult, savedResult, schedulesResult] = await Promise.all([
        supabase.from('report_templates').select('*').or(`user_id.eq.${user.id},is_public.eq.true`),
        supabase.from('saved_reports').select('*').eq('user_id', user.id),
        supabase.from('report_schedules').select('*').eq('user_id', user.id)
      ]);

      if (templatesResult.data) setTemplates(templatesResult.data as ReportTemplate[]);
      if (savedResult.data) setSavedReports(savedResult.data as SavedReport[]);
      if (schedulesResult.data) setSchedules(schedulesResult.data as ReportSchedule[]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate report data based on filters
  const generateReportData = async (filters: ReportFilters) => {
    if (!user) return null;

    try {
      let query = supabase.from('transactions').select(`
        *,
        categories (name, type, color, icon)
      `).eq('user_id', user.id);

      // Apply date filter
      if (filters.dateRange.start) {
        query = query.gte('date', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        query = query.lte('date', filters.dateRange.end);
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        query = query.in('category_id', filters.categories);
      }

      // Apply transaction type filter
      if (filters.transactionTypes.length > 0) {
        query = query.in('type', filters.transactionTypes);
      }

      // Apply amount range filter
      if (filters.amountRange.min !== null) {
        query = query.gte('amount', filters.amountRange.min);
      }
      if (filters.amountRange.max !== null) {
        query = query.lte('amount', filters.amountRange.max);
      }

      // Apply payment method filter
      if (filters.paymentMethods.length > 0) {
        query = query.in('payment_method', filters.paymentMethods);
      }

      // Apply description filter
      if (filters.description) {
        query = query.ilike('description', `%${filters.description}%`);
      }

      const { data: transactions, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      return transactions;
    } catch (error) {
      console.error('Error generating report data:', error);
      throw error;
    }
  };

  // Create template
  const createTemplate = async (data: Omit<ReportTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const result = await executeSecurely(
      {
        endpoint: 'reports/create-template',
        action: 'report_create',
        resource: 'report_template',
        maxRequests: 10,
        windowMinutes: 1
      },
      async () => {
        const { data: result, error } = await supabase
          .from('report_templates')
          .insert({ ...data, user_id: user.id } as any)
          .select()
          .single();

        if (error) throw error;

        setTemplates(prev => [...prev, result as ReportTemplate]);
        toast({
          title: 'Sucesso',
          description: 'Template de relatório criado'
        });
        return result;
      },
      { templateName: data.name }
    );

    return result;
  };

  // Save report
  const saveReport = async (data: Omit<SavedReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const result = await executeSecurely(
      {
        endpoint: 'reports/save',
        action: 'report_create',
        resource: 'saved_report',
        maxRequests: 10,
        windowMinutes: 1
      },
      async () => {
        const { data: result, error } = await supabase
          .from('saved_reports')
          .insert({ ...data, user_id: user.id } as any)
          .select()
          .single();

        if (error) throw error;

        setSavedReports(prev => [...prev, result as SavedReport]);
        toast({
          title: 'Sucesso',
          description: 'Relatório salvo com sucesso'
        });
        return result;
      },
      { reportName: data.name }
    );

    return result;
  };

  // Delete saved report
  const deleteSavedReport = async (id: string) => {
    const result = await executeSecurely(
      {
        endpoint: 'reports/delete',
        action: 'report_delete',
        resource: 'saved_report',
        maxRequests: 10,
        windowMinutes: 1
      },
      async () => {
        const { error } = await supabase
          .from('saved_reports')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setSavedReports(prev => prev.filter(report => report.id !== id));
        toast({
          title: 'Sucesso',
          description: 'Relatório removido'
        });
        return true;
      },
      { reportId: id }
    );

    return result;
  };

  // Export to CSV
  const exportToCSV = async (data: any[], filename: string) => {
    await executeSecurely(
      {
        endpoint: 'reports/export',
        action: 'export_data',
        resource: 'report',
        maxRequests: 5,
        windowMinutes: 1
      },
      async () => {
        const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Método de Pagamento'];
        const csvContent = [
          headers.join(','),
          ...data.map(transaction => [
            transaction.date,
            `"${transaction.description}"`,
            transaction.categories?.name || 'Sem categoria',
            transaction.type === 'income' ? 'Receita' : 'Despesa',
            transaction.amount,
            transaction.payment_method || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Sucesso',
          description: 'Relatório exportado para CSV'
        });
        return true;
      },
      { filename, recordCount: data.length }
    );
  };

  // Calculate report statistics
  const calculateReportStats = (transactions: any[]) => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    const categoriesData = transactions.reduce((acc, transaction) => {
      const categoryName = transaction.categories?.name || 'Sem categoria';
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, count: 0, type: transaction.type };
      }
      acc[categoryName].total += Number(transaction.amount);
      acc[categoryName].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; type: string }>);

    const topCategories = Object.entries(categoriesData)
      .sort(([, a], [, b]) => (b as any).total - (a as any).total)
      .slice(0, 5) as [string, { total: number; count: number; type: string }][];

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? (totalIncome + totalExpenses) / transactions.length : 0,
      categoriesData,
      topCategories
    };
  };

  useEffect(() => {
    fetchReportsData();
  }, [user]);

  return {
    // Data
    templates,
    savedReports,
    schedules,
    loading,

    // Methods
    fetchReportsData,
    generateReportData,
    createTemplate,
    saveReport,
    deleteSavedReport,
    exportToCSV,
    calculateReportStats
  };
};
