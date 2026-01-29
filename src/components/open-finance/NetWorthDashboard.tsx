import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Building2, CreditCard, TrendingUp as Investment } from 'lucide-react';
import { useOpenFinance } from '@/hooks/useOpenFinance';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NetWorthDashboard() {
    const { netWorth, accounts, isLoading } = useOpenFinance();
    const { user } = useAuth();

    const { data: netWorthHistory } = useQuery({
        queryKey: ['net-worth-history', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('account_balance_history')
                .select('date, balance')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo)
                .order('date', { ascending: true });

            if (error) throw error;

            const grouped = data.reduce((acc: any, curr: any) => {
                if (!acc[curr.date]) {
                    acc[curr.date] = 0;
                }
                acc[curr.date] += Number(curr.balance);
                return acc;
            }, {});

            return Object.entries(grouped).map(([date, total]) => ({
                date,
                netWorth: total,
            }));
        },
        enabled: !!user,
    });

    const calculateVariation = () => {
        if (!netWorthHistory || netWorthHistory.length < 2) return { value: 0, percentage: 0 };

        const current = Number(netWorthHistory[netWorthHistory.length - 1]?.netWorth) || 0;
        const previous = Number(netWorthHistory[0]?.netWorth) || 0;

        const value = current - previous;
        const percentage = previous !== 0 ? ((value / previous) * 100) : 0;

        return { value, percentage };
    };

    const variation = calculateVariation();

    const accountsByType = accounts.reduce((acc: any, account) => {
        const type = account.type;
        if (!acc[type]) {
            acc[type] = { total: 0, count: 0 };
        }
        acc[type].total += Number(account.balance);
        acc[type].count += 1;
        return acc;
    }, {});

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'BANK':
                return <Building2 className="h-5 w-5" />;
            case 'CREDIT':
                return <CreditCard className="h-5 w-5" />;
            case 'INVESTMENT':
                return <Investment className="h-5 w-5" />;
            default:
                return <Wallet className="h-5 w-5" />;
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'BANK':
                return 'Contas Bancárias';
            case 'CREDIT':
                return 'Cartões de Crédito';
            case 'INVESTMENT':
                return 'Investimentos';
            default:
                return type;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-pulse text-muted-foreground">Carregando patrimônio...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                    <CardDescription>Patrimônio Líquido Total</CardDescription>
                    <CardTitle className="text-4xl font-bold">
                        {formatCurrency(netWorth)}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm">
                        {variation.value >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={variation.value >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {variation.value >= 0 ? '+' : ''}{formatCurrency(variation.value)} ({variation.percentage.toFixed(2)}%)
                        </span>
                        <span className="text-muted-foreground">últimos 30 dias</span>
                    </div>
                </CardHeader>
            </Card>

            {}
            {netWorthHistory && netWorthHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Evolução Patrimonial</CardTitle>
                        <CardDescription>Últimos 30 dias</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={netWorthHistory}>
                                <defs>
                                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: ptBR })}
                                    className="text-xs"
                                />
                                <YAxis
                                    tickFormatter={(value) => formatCurrency(value, true)}
                                    className="text-xs"
                                />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="netWorth"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorNetWorth)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {}
            <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(accountsByType).map(([type, data]: [string, any]) => (
                    <Card key={type}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{getTypeName(type)}</CardTitle>
                            {getTypeIcon(type)}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.count} {data.count === 1 ? 'conta' : 'contas'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}