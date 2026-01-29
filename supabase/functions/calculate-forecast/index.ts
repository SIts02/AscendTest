import { supabase } from '@/integrations/supabase/client';

import { serve } from 'https:
import { createClient } from 'https:

interface ForecastDataPoint {
    date: string;
    projectedBalance: number;
    confidence: number;
    breakdown: {
        income: number;
        expenses: number;
        recurring: number;
    };
}

serve(async (req) => {
    try {

        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { days = 30, includeRecurring = true } = await req.json();

        const { data: balanceData } = await supabaseClient.rpc('get_current_balance', {
            p_user_id: user.id,
        });

        let currentBalance = balanceData || 0;
        const forecastPoints: ForecastDataPoint[] = [];

        const { data: transactions } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

        const { data: recurringTransactions } = await supabaseClient
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        const recentExpenses = transactions?.filter(t => t.type === 'expense').slice(0, 30) || [];
        const averageDailyExpense = recentExpenses.length > 0
            ? recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 30
            : 0;

        for (let i = 0; i <= days; i++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + i);

            let dailyIncome = 0;
            let dailyExpenses = 0;
            let recurringAmount = 0;

            if (includeRecurring && recurringTransactions) {
                recurringTransactions.forEach((recurring: any) => {
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

            const dayOfWeek = targetDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                dailyExpenses += averageDailyExpense;
                currentBalance -= averageDailyExpense;
            }

            const confidence = Math.max(0.5, 1 - (i / days) * 0.5);

            forecastPoints.push({
                date: targetDate.toISOString().split('T')[0],
                projectedBalance: currentBalance,
                confidence,
                breakdown: {
                    income: dailyIncome,
                    expenses: dailyExpenses,
                    recurring: recurringAmount,
                },
            });
        }

        const records = forecastPoints.map(point => ({
            user_id: user.id,
            forecast_date: point.date,
            projected_balance: point.projectedBalance,
            confidence_level: point.confidence,
            metadata: {
                breakdown: point.breakdown,
            },
        }));

        const { error: insertError } = await supabaseClient
            .from('balance_forecasts')
            .upsert(records, { onConflict: 'user_id,forecast_date' });

        if (insertError) throw insertError;

        return new Response(
            JSON.stringify({
                success: true,
                data: forecastPoints,
                message: `Forecast calculado para ${days} dias`,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error calculating forecast:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
});

function shouldExecuteOnDate(recurring: any, targetDate: Date): boolean {
    const nextExecution = new Date(recurring.next_execution_date);
    const targetDateOnly = new Date(targetDate.toDateString());
    const nextExecutionOnly = new Date(nextExecution.toDateString());

    if (targetDateOnly < nextExecutionOnly) return false;

    const daysDiff = Math.floor((targetDateOnly.getTime() - nextExecutionOnly.getTime()) / (1000 * 60 * 60 * 24));

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