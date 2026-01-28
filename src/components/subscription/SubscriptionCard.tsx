import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function SubscriptionCard() {
    const navigate = useNavigate();
    const { subscription, currentPlan } = useSubscription();

    if (!subscription || !currentPlan) {
        return null;
    }

    const transactionsPercentage = currentPlan.max_transactions_per_month === -1
        ? 0
        : (subscription.transactions_used_this_month / currentPlan.max_transactions_per_month) * 100;

    const forecastsPercentage = currentPlan.max_forecasts_per_month === -1
        ? 0
        : (subscription.forecasts_used_this_month / currentPlan.max_forecasts_per_month) * 100;

    const isNearLimit = transactionsPercentage > 80 || forecastsPercentage > 80;
    const isPremium = currentPlan.name === 'premium';

    return (
        <Card className={isPremium ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-50/50 to-background' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isPremium && <Crown className="h-5 w-5 text-yellow-600" />}
                        <CardTitle className="text-lg">Plano {currentPlan.display_name}</CardTitle>
                    </div>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'Ativo' : subscription.status}
                    </Badge>
                </div>
                <CardDescription>{currentPlan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {}
                {currentPlan.max_transactions_per_month !== -1 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Transações este mês</span>
                            <span className="font-medium">
                                {subscription.transactions_used_this_month} / {currentPlan.max_transactions_per_month}
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${transactionsPercentage > 80 ? 'bg-red-500' : 'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(transactionsPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {currentPlan.max_forecasts_per_month !== -1 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Projeções este mês</span>
                            <span className="font-medium">
                                {subscription.forecasts_used_this_month} / {currentPlan.max_forecasts_per_month}
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${forecastsPercentage > 80 ? 'bg-red-500' : 'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(forecastsPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {}
                {subscription.stripe_current_period_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <Calendar className="h-4 w-4" />
                        <span>
                            Próxima cobrança:{' '}
                            {format(new Date(subscription.stripe_current_period_end), 'dd/MM/yyyy', {
                                locale: ptBR,
                            })}
                        </span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex gap-2">
                {currentPlan.name !== 'premium' && (
                    <Button variant="default" size="sm" className="flex-1" onClick={() => navigate('/dashboard/billing')}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Fazer Upgrade
                    </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/dashboard/billing')}>
                    Gerenciar
                </Button>
            </CardFooter>
        </Card>
    );
}