import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { useState } from 'react';

interface FeatureGateProps {
    children: ReactNode;
    feature: 'open_finance' | 'advanced_analytics' | 'ai_insights' | 'priority_support' | 'export_reports' | 'api_access';
    featureDisplay: string;
    fallback?: ReactNode;
    requiredPlan?: 'pro' | 'premium';
}

export function FeatureGate({ children, feature, featureDisplay, fallback, requiredPlan = 'pro' }: FeatureGateProps) {
    const { currentPlan } = useSubscription();
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    const hasAccess = currentPlan?.[`has_${feature}` as keyof typeof currentPlan] as boolean;

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <>
            <div onClick={() => setShowUpgradePrompt(true)} className="cursor-pointer">
                {children}
            </div>
            <UpgradePrompt
                isOpen={showUpgradePrompt}
                onClose={() => setShowUpgradePrompt(false)}
                feature={feature}
                featureDisplay={featureDisplay}
                requiredPlan={requiredPlan}
            />
        </>
    );
}