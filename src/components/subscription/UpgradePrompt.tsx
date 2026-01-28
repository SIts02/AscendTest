import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Check } from 'lucide-react';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/utils';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
    featureDisplay: string;
    requiredPlan?: 'pro' | 'premium';
}

export function UpgradePrompt({ isOpen, onClose, feature, featureDisplay, requiredPlan = 'pro' }: UpgradePromptProps) {
    const { plans, currentPlan, createCheckout, isCreatingCheckout } = useSubscription();

    const targetPlan = plans.find((p) => p.name === requiredPlan);
    const needsUpgrade = !currentPlan || (
        (requiredPlan === 'premium' && currentPlan.name !== 'premium') ||
        (requiredPlan === 'pro' && currentPlan.name === 'free')
    );

    if (!needsUpgrade || !targetPlan) return null;

    const handleUpgrade = () => {
        if (targetPlan.stripe_price_id_monthly) {
            createCheckout({
                priceId: targetPlan.stripe_price_id_monthly,
                billingCycle: 'monthly',
            });
        }
    };

    const features = {
        pro: [
            'Até 500 transações/mês',
            '5 contas conectadas',
            'Open Finance',
            'Análises Avançadas',
            '100 projeções/mês',
        ],
        premium: [
            'Transações ilimitadas',
            'Contas ilimitadas',
            'Open Finance',
            'Análises Avançadas',
            'Insights com IA',
            'Suporte Prioritário',
            'Exportação de Relatórios',
            'Acesso via API',
        ],
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        {requiredPlan === 'premium' ? (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                <Crown className="h-8 w-8 text-white" />
                            </div>
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                        )}
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        Upgrade para {targetPlan.display_name}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {featureDisplay} está disponível apenas para usuários {targetPlan.display_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {}
                    <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold">
                                {formatCurrency(targetPlan.price_monthly)}
                            </span>
                            <span className="text-muted-foreground">/mês</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            ou {formatCurrency(targetPlan.price_yearly)} anualmente
                        </p>
                    </div>

                    {}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="font-semibold mb-3">O que você ganha:</p>
                        <ul className="space-y-2">
                            {features[requiredPlan].map((f, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isCreatingCheckout}>
                        Agora não
                    </Button>
                    <Button onClick={handleUpgrade} disabled={isCreatingCheckout}>
                        {isCreatingCheckout ? 'Processando...' : `Fazer Upgrade`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}