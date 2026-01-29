
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    stripe_product_id TEXT,

    max_transactions_per_month INTEGER DEFAULT -1,
    max_connected_accounts INTEGER DEFAULT -1,
    max_forecasts_per_month INTEGER DEFAULT -1,
    max_recurring_transactions INTEGER DEFAULT -1,

    has_open_finance BOOLEAN DEFAULT FALSE,
    has_advanced_analytics BOOLEAN DEFAULT FALSE,
    has_ai_insights BOOLEAN DEFAULT FALSE,
    has_priority_support BOOLEAN DEFAULT FALSE,
    has_export_reports BOOLEAN DEFAULT FALSE,
    has_api_access BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_transactions_per_month, max_connected_accounts, max_forecasts_per_month, has_open_finance, has_advanced_analytics, has_ai_insights, sort_order) VALUES
('free', 'Free', 'Para começar a organizar suas finanças', 0, 0, 50, 1, 10, false, false, false, 1),
('pro', 'Pro', 'Para quem quer controle total', 19.90, 199.00, 500, 5, 100, true, true, false, 2),
('premium', 'Premium', 'Para profissionais e empresários', 49.90, 499.00, -1, -1, -1, true, true, true, 3)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),

    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_current_period_start TIMESTAMPTZ,
    stripe_current_period_end TIMESTAMPTZ,
    stripe_cancel_at_period_end BOOLEAN DEFAULT FALSE,

    status TEXT NOT NULL DEFAULT 'active',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    trial_ends_at TIMESTAMPTZ,

    transactions_used_this_month INTEGER DEFAULT 0,
    forecasts_used_this_month INTEGER DEFAULT 0,
    last_usage_reset_at TIMESTAMPTZ DEFAULT NOW(),

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    canceled_at TIMESTAMPTZ,

    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    stripe_payment_method_id TEXT NOT NULL,
    type TEXT NOT NULL,

    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,

    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,

    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL,

    description TEXT,
    invoice_url TEXT,
    invoice_pdf_url TEXT,

    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_stripe_invoice ON billing_history(stripe_invoice_id);

CREATE OR REPLACE FUNCTION check_feature_access(
    p_user_id UUID,
    p_feature_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN := FALSE;
BEGIN
    SELECT
        CASE p_feature_name
            WHEN 'open_finance' THEN sp.has_open_finance
            WHEN 'advanced_analytics' THEN sp.has_advanced_analytics
            WHEN 'ai_insights' THEN sp.has_ai_insights
            WHEN 'priority_support' THEN sp.has_priority_support
            WHEN 'export_reports' THEN sp.has_export_reports
            WHEN 'api_access' THEN sp.has_api_access
            ELSE FALSE
        END INTO v_has_access
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
      AND us.status = 'active';

    RETURN COALESCE(v_has_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id UUID,
    p_limit_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_limit INTEGER;
    v_used INTEGER;
BEGIN

    UPDATE user_subscriptions
    SET
        transactions_used_this_month = 0,
        forecasts_used_this_month = 0,
        last_usage_reset_at = NOW()
    WHERE user_id = p_user_id
      AND last_usage_reset_at < DATE_TRUNC('month', NOW());

    SELECT
        CASE p_limit_type
            WHEN 'transactions' THEN sp.max_transactions_per_month
            WHEN 'forecasts' THEN sp.max_forecasts_per_month
            WHEN 'connected_accounts' THEN sp.max_connected_accounts
            WHEN 'recurring_transactions' THEN sp.max_recurring_transactions
            ELSE -1
        END,
        CASE p_limit_type
            WHEN 'transactions' THEN us.transactions_used_this_month
            WHEN 'forecasts' THEN us.forecasts_used_this_month
            ELSE 0
        END
    INTO v_limit, v_used
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
      AND us.status = 'active';

    v_result := jsonb_build_object(
        'has_access', (v_limit = -1 OR v_used < v_limit),
        'limit', v_limit,
        'used', v_used,
        'remaining', CASE WHEN v_limit = -1 THEN -1 ELSE GREATEST(0, v_limit - v_used) END
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_usage_type TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE user_subscriptions
    SET
        transactions_used_this_month = CASE WHEN p_usage_type = 'transactions' THEN transactions_used_this_month + 1 ELSE transactions_used_this_month END,
        forecasts_used_this_month = CASE WHEN p_usage_type = 'forecasts' THEN forecasts_used_this_month + 1 ELSE forecasts_used_this_month END
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment methods"
    ON payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods"
    ON payment_methods FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own billing history"
    ON billing_history FOR SELECT
    USING (auth.uid() = user_id);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription plans are viewable by everyone"
    ON subscription_plans FOR SELECT
    USING (is_active = TRUE);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
DECLARE
    v_free_plan_id UUID;
BEGIN

    SELECT id INTO v_free_plan_id
    FROM subscription_plans
    WHERE name = 'free'
    LIMIT 1;

    IF v_free_plan_id IS NOT NULL THEN
        INSERT INTO user_subscriptions (user_id, plan_id, status)
        VALUES (NEW.id, v_free_plan_id, 'active');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();