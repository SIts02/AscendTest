export interface FeatureFlags {
    enableForecasting: boolean;
    enableOpenFinance: boolean;
    enableSubscriptions: boolean;
    enableAIInsights: boolean;
    enableAdvancedAnalytics: boolean;
}

export function getFeatureFlags(): FeatureFlags {
    return {
        enableForecasting: import.meta.env.VITE_ENABLE_FORECASTING === 'true',
        enableOpenFinance: import.meta.env.VITE_ENABLE_OPEN_FINANCE === 'true',
        enableSubscriptions: import.meta.env.VITE_ENABLE_SUBSCRIPTIONS === 'true',
        enableAIInsights: import.meta.env.VITE_ENABLE_AI_INSIGHTS === 'true',
        enableAdvancedAnalytics: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true',
    };
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
    const flags = getFeatureFlags();
    return flags[flag];
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
    const flags = getFeatureFlags();
    return flags[flag];
}