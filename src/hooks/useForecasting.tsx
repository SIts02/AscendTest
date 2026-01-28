import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, differenceInDays, format } from 'date-fns';
import { useTransactions } from './useTransactions';
import { useRecurringTransactions } from './useRecurringTransactions';

export interface ForecastDataPoint {
    date: Date;
    projectedBalance: number;
    confidence: number;
    breakdown: {
        income: number;
        expenses: number;
        recurring: number;
    };
}

export interface ForecastOptions {
    days: 30 | 60 | 90;
    includeRecurring?: boolean;
    includeGoals?: boolean;
}

interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    next_execution_date: string;
}

export function useForecasting({ days = 30, includeRecurring = true }: ForecastOptions) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { transactions } = useTransactions();
    const { data: recurringTransactions } = useRecurringTransactions();

    const { data: cachedForecasts, isLoading } = useQuery({
        queryKey: ['forecasts', user?.id, days],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('balance_forecasts')
                .select('*')
                .eq('user_id', user.id)
                .gte('forecast_date', format(new Date(), 'yyyy-MM-dd'))
                .lte('forecast_date', format(addDays(new Date(), days), 'yyyy-MM-dd'))
                .order('forecast_date', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const calculateForecast = async (): Promise<ForecastDataPoint[]> => {
        if (!user || !transactions) return [];

        const { data: balanceData } = await supabase.rpc('get_current_balance', {
            p_user_id: user.id,
        });

        let currentBalance = balanceData || 0;
        const forecastPoints: ForecastDataPoint[] = [];

        for (let i = 0; i <= days; i++) {
            const targetDate = addDays(new Date(), i);
            let dailyIncome = 0;
            let dailyExpenses = 0;
            let recurringAmount = 0;

            if (includeRecurring && recurringTransactions) {
                recurringTransactions.forEach((recurring: RecurringTransaction) => {
                    if (shouldExecuteOnDate(recurring, targetDate)) {
                        const amount = recurring.amount;
                        if (recurring.type === 'income') {
                            dailyIncome += amount;
                            currentBalance += amount;
                        } else {
                            dailyExpenses += amount;
                            currentBalance -= amount;
                        }
                        recurringAmount += recurring.type === 'income' ? amount : -amount;
                    }
                });
            }

            const recentTransactions = transactions.filter(t => {
                const daysDiff = differenceInDays(new Date(), new Date(t.date));
                return daysDiff >= 0 && daysDiff <= 30 && t.type === 'expense';
            });

            const averageDailyExpense = recentTransactions.length > 0
                ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / 30
                : 0;

            const dayOfWeek = targetDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                dailyExpenses += averageDailyExpense;
                currentBalance -= averageDailyExpense;
            }

            const confidence = Math.max(0.5, 1 - (i / days) * 0.5);

            forecastPoints.push({
                date: targetDate,
                projectedBalance: currentBalance,
                confidence,
                breakdown: {
                    income: dailyIncome,
                    expenses: dailyExpenses,
                    recurring: recurringAmount,
                },
            });
        }

        return forecastPoints;
    };

    const saveForecastMutation = useMutation({
        mutationFn: async (forecastData: ForecastDataPoint[]) => {
            if (!user) throw new Error('User not authenticated');

            const records = forecastData.map(point => ({
                user_id: user.id,
                forecast_date: format(point.date, 'yyyy-MM-dd'),
                projected_balance: point.projectedBalance,
                confidence_level: point.confidence,
                metadata: {
                    breakdown: point.breakdown,
                },
            }));

            const { error } = await supabase
                .from('balance_forecasts')
                .upsert(records, { onConflict: 'user_id,forecast_date' });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forecasts', user?.id] });
        },
    });

    const recalculateMutation = useMutation({
        mutationFn: calculateForecast,
        onSuccess: (data) => {
            saveForecastMutation.mutate(data);
        },
    });

    const forecastData: ForecastDataPoint[] = cachedForecasts?.map(f => ({
        date: new Date(f.forecast_date),
        projectedBalance: Number(f.projected_balance),
        confidence: Number(f.confidence_level || 0.8),
        breakdown: f.metadata?.breakdown || { income: 0, expenses: 0, recurring: 0 },
    })) || [];

    return {
        forecastData,
        isLoading,
        recalculate: recalculateMutation.mutate,
        isRecalculating: recalculateMutation.isPending,
    };
}

function shouldExecuteOnDate(recurring: RecurringTransaction, targetDate: Date): boolean {
    const nextExecution = new Date(recurring.next_execution_date);
    const targetDateOnly = new Date(targetDate.toDateString());
    const nextExecutionOnly = new Date(nextExecution.toDateString());

    if (targetDateOnly < nextExecutionOnly) return false;

    const daysDiff = differenceInDays(targetDateOnly, nextExecutionOnly);

    switch (recurring.frequency) {
        case 'daily':
            return daysDiff % 1 === 0;
        case 'weekly':
            return daysDiff % 7 === 0;
        case 'monthly':
            return targetDate.getDate() === nextExecution.getDate();
        case 'yearly':
            return (
                targetDate.getDate() === nextExecution.getDate() &&
                targetDate.getMonth() === nextExecution.getMonth()
            );
        default:
            return false;
    }
}