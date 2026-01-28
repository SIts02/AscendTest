import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, FileText, Calendar, TrendingUp, Settings, ExternalLink } from 'lucide-react';

interface BillingHistory {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    invoice_url: string | null;
    invoice_pdf_url: string | null;
    paid_at: string | null;
    created_at: string;
}

export default function BillingDashboard() {
    const { user } = useAuth();
    const { subscription, currentPlan, openCustomerPortal, isOpeningPortal } = useSubscription();

    const { data: billingHistory } = useQuery<BillingHistory[]>({
        queryKey: ['billing-history', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('billing_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data as BillingHistory[];
        },
        enabled: !!user,
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            paid: { variant: 'default', label: 'Pago' },
            pending: { variant: 'secondary', label: 'Pendente' },
            failed: { variant: 'destructive', label: 'Falhou' },
            refunded: { variant: 'outline', label: 'Reembolsado' },
        };

        const config = variants[status] || { variant: 'outline', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <DashboardLayout activePage="Billing">
            <div className="space-y-6">
                {}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Assinatura e Billing</h1>
                    <p className="text-muted-foreground">
                        Gerencie sua assinatura e histórico de pagamentos
                    </p>
                </div>

                {}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Plano Atual</CardTitle>
                                <CardDescription>
                                    {currentPlan?.description}
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => openCustomerPortal()}
                                disabled={isOpeningPortal}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Gerenciar Assinatura
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Detalhes do Plano
                                </h4>
                                <dl className="space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-muted-foreground">Nome do Plano</dt>
                                        <dd className="text-sm font-medium">{currentPlan?.display_name}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-muted-foreground">Status</dt>
                                        <dd>
                                            <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                                                {subscription?.status === 'active' ? 'Ativo' : subscription?.status}
                                            </Badge>
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-muted-foreground">Ciclo de Cobrança</dt>
                                        <dd className="text-sm font-medium">
                                            {subscription?.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                                        </dd>
                                    </div>
                                    {subscription?.stripe_current_period_end && (
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-muted-foreground">Próxima Cobrança</dt>
                                            <dd className="text-sm font-medium">
                                                {format(new Date(subscription.stripe_current_period_end), 'dd/MM/yyyy', {
                                                    locale: ptBR,
                                                })}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Uso Mensal
                                </h4>
                                <dl className="space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-muted-foreground">Transações</dt>
                                        <dd className="text-sm font-medium">
                                            {subscription?.transactions_used_this_month || 0}
                                            {currentPlan?.max_transactions_per_month !== -1 &&
                                                ` / ${currentPlan?.max_transactions_per_month}`}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-muted-foreground">Projeções</dt>
                                        <dd className="text-sm font-medium">
                                            {subscription?.forecasts_used_this_month || 0}
                                            {currentPlan?.max_forecasts_per_month !== -1 &&
                                                ` / ${currentPlan?.max_forecasts_per_month}`}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Histórico de Pagamentos
                        </CardTitle>
                        <CardDescription>Últimas 10 transações</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!billingHistory || billingHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>Nenhum histórico de pagamento</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {billingHistory.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between p-4 rounded-lg border"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium">{invoice.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {invoice.paid_at
                                                    ? format(new Date(invoice.paid_at), "dd/MM/yyyy 'às' HH:mm", {
                                                        locale: ptBR,
                                                    })
                                                    : format(new Date(invoice.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                                        locale: ptBR,
                                                    })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold">{formatCurrency(invoice.amount)}</p>
                                                {getStatusBadge(invoice.status)}
                                            </div>

                                            {invoice.invoice_url && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}