import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from './useTransactions';
import { differenceInDays } from 'date-fns';

export interface Anomaly {
    id: string;
    transaction_id: string | null;
    category_id: string | null;
    anomaly_type: 'spike' | 'unusual_category' | 'missing_expected' | 'low_balance';
    severity: 'low' | 'medium' | 'high';
    description: string;
    historical_avg: number | null;
    current_value: number | null;
    deviation_percentage: number | null;
    suggested_action: string | null;
    is_acknowledged: boolean;
    detected_at: string;
}

export function useAnomalyDetection() {
    const { user } = useAuth();
    const { transactions } = useTransactions();

    const { data: anomalies, isLoading } = useQuery<Anomaly[]>({
        queryKey: ['anomalies', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('financial_anomalies')
                .select('*')
                .eq('user_id', user.id)
                .order('detected_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data as Anomaly[];
        },
        enabled: !!user,
    });

    const detectAnomalies = async () => {
        if (!user || !transactions || transactions.length === 0) return;

        const newAnomalies: any[] = [];
        const last90Days = transactions.filter(t =>
            differenceInDays(new Date(), new Date(t.date)) <= 90
        );

        const byCategory = last90Days.reduce((acc, t) => {
            const catId = t.category_id || 'uncategorized';
            if (!acc[catId]) acc[catId] = [];
            acc[catId].push(t);
            return acc;
        }, {} as Record<string, any[]>);

        Object.entries(byCategory).forEach(([categoryId, txns]) => {
            if (txns.length < 3) return;

            const amounts = txns.map((t: any) => t.amount);
            const avg = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(
                amounts.map((x: number) => Math.pow(x - avg, 2)).reduce((a: number, b: number) => a + b, 0) / amounts.length
            );

            txns.forEach((txn: any) => {
                if (txn.amount > avg + 2 * stdDev) {
                    const deviation = ((txn.amount - avg) / avg) * 100;

                    newAnomalies.push({
                        user_id: user.id,
                        transaction_id: txn.id,
                        category_id: categoryId === 'uncategorized' ? null : categoryId,
                        anomaly_type: 'spike',
                        severity: deviation > 100 ? 'high' : deviation > 50 ? 'medium' : 'low',
                        description: `Gasto ${deviation.toFixed(0)}% acima da média em ${txn.description}`,
                        historical_avg: avg,
                        current_value: txn.amount,
                        deviation_percentage: deviation,
                        suggested_action: 'Verifique se este gasto era planejado e considere ajustar seu orçamento.',
                        is_acknowledged: false,
                    });
                }
            });
        });

        if (newAnomalies.length > 0) {
            const { error } = await supabase
                .from('financial_anomalies')
                .insert(newAnomalies);

            if (error) console.error('Error saving anomalies:', error);
        }
    };

    return {
        anomalies: anomalies || [],
        isLoading,
        detectAnomalies,
        unacknowledgedCount: anomalies?.filter(a => !a.is_acknowledged).length || 0,
    };
}