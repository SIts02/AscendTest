import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PricingPlans() {
    const { plans, currentPlan, createCheckout, isCreatingCheckout } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const getPlanIcon = (planName: string) => {
        switch (planName) {
            case 'free':
                return <Sparkles className="h-6 w-6" />;
            case 'pro':
                return <Zap className="h-6 w-6" />;
            case 'premium':
                return <Crown className="h-6 w-6" />;
            default:
                return null;
        }
    };

    const getPlanColor = (planName: string) => {
        switch (planName) {
            case 'free':
                return 'border-gray-200';
            case 'pro':
                return 'border-primary';
            case 'premium':
                return 'border-yellow-500';
            default:
                return 'border-gray-200';
        }
    };

    const handleUpgrade = (plan: any) => {
        const priceId = billingCycle === 'monthly'
            ? plan.stripe_price_id_monthly
            : plan.stripe_price_id_yearly;

        if (!priceId) {
            console.error('No price ID found for plan:', plan.name);
            return;
        }

        createCheckout({ priceId, billingCycle });
    };

    return (
        <div className="space-y-8">
            {}
            <div className="flex justify-center">
                <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="monthly">Mensal</TabsTrigger>
                        <TabsTrigger value="yearly">
                            Anual
                            <Badge variant="secondary" className="ml-2">-17%</Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {}
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                    const monthlyPrice = billingCycle === 'yearly' ? price / 12 : price;
                    const isCurrentPlan = currentPlan?.id === plan.id;
                    const isPremium = plan.name === 'premium';

                    return (
                        <Card
                            key={plan.id}
                            className={`relative ${getPlanColor(plan.name)} ${isPremium ? 'shadow-xl border-2' : ''
                                }`}
                        >
                            {isPremium && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                                        Mais Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getPlanIcon(plan.name)}
                                        <CardTitle>{plan.display_name}</CardTitle>
                                    </div>
                                    {isCurrentPlan && (
                                        <Badge variant="default">Plano Atual</Badge>
                                    )}
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {}
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">
                                            {formatCurrency(monthlyPrice)}
                                        </span>
                                        <span className="text-muted-foreground">/mês</span>
                                    </div>
                                    {billingCycle === 'yearly' && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {formatCurrency(price)} cobrado anualmente
                                        </p>
                                    )}
                                </div>

                                {}
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                        <span className="text-sm">
                                            {plan.max_transactions_per_month === -1
                                                ? 'Transações ilimitadas'
                                                : `Até ${plan.max_transactions_per_month} transações/mês`}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                        <span className="text-sm">
                                            {plan.max_connected_accounts === -1
                                                ? 'Contas conectadas ilimitadas'
                                                : `${plan.max_connected_accounts} contas conectadas`}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                        <span className="text-sm">
                                            {plan.max_forecasts_per_month === -1
                                                ? 'Projeções ilimitadas'
                                                : `${plan.max_forecasts_per_month} projeções/mês`}
                                        </span>
                                    </li>

                                    {plan.has_open_finance && (
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm">Open Finance</span>
                                        </li>
                                    )}

                                    {plan.has_advanced_analytics && (
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm">Análises Avançadas</span>
                                        </li>
                                    )}

                                    {plan.has_ai_insights && (
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm">Insights com IA</span>
                                        </li>
                                    )}

                                    {plan.has_priority_support && (
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm">Suporte Prioritário</span>
                                        </li>
                                    )}

                                    {plan.has_export_reports && (
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm">Exportação de Relatórios</span>
                                        </li>
                                    )}

                                    {plan.has_api_access && (
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                                            <span className="text-sm">Acesso via API</span>
                                        </li>
                                    )}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                {plan.name === 'free' ? (
                                    <Button
                                        className="w-full"
                                        variant={isCurrentPlan ? 'outline' : 'default'}
                                        disabled
                                    >
                                        {isCurrentPlan ? 'Plano Atual' : 'Gratuito'}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        variant={isPremium ? 'default' : 'outline'}
                                        onClick={() => handleUpgrade(plan)}
                                        disabled={isCreatingCheckout || isCurrentPlan}
                                    >
                                        {isCurrentPlan ? 'Plano Atual' : 'Fazer Upgrade'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}