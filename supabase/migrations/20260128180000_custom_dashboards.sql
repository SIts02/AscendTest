
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS dashboard_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',

    layout_config JSONB NOT NULL,

    preview_image_url TEXT,

    min_tier TEXT,
    is_public BOOLEAN DEFAULT TRUE,

    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    layout_config JSONB NOT NULL DEFAULT '{"widgets": []}',

    is_default BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    template_id UUID REFERENCES dashboard_templates(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_dashboards_user_id ON user_dashboards(user_id);

ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dashboards"
    ON user_dashboards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own dashboards"
    ON user_dashboards FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE dashboard_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by all"
    ON dashboard_templates FOR SELECT
    USING (is_public = TRUE);

CREATE TRIGGER update_dashboard_templates_updated_at
    BEFORE UPDATE ON dashboard_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboards_updated_at
    BEFORE UPDATE ON user_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO dashboard_templates (name, description, category, layout_config, min_tier) VALUES
('Visão Geral', 'Dashboard completo com todas as métricas principais', 'general',
'{"widgets": [
    {"id": "net-worth", "type": "NetWorthWidget", "position": {"x": 0, "y": 0, "w": 6, "h": 2}},
    {"id": "cash-flow", "type": "CashFlowWidget", "position": {"x": 6, "y": 0, "w": 6, "h": 2}},
    {"id": "budget-progress", "type": "BudgetProgressWidget", "position": {"x": 0, "y": 2, "w": 4, "h": 2}},
    {"id": "goals", "type": "GoalsWidget", "position": {"x": 4, "y": 2, "w": 4, "h": 2}},
    {"id": "recent-transactions", "type": "TransactionsTableWidget", "position": {"x": 8, "y": 2, "w": 4, "h": 3}}
]}', null),

('Investidor', 'Foco em investimentos e crescimento patrimonial', 'investor',
'{"widgets": [
    {"id": "net-worth", "type": "NetWorthWidget", "position": {"x": 0, "y": 0, "w": 12, "h": 3}},
    {"id": "forecast", "type": "ForecastWidget", "position": {"x": 0, "y": 3, "w": 8, "h": 3}},
    {"id": "category-breakdown", "type": "CategoryBreakdownWidget", "position": {"x": 8, "y": 3, "w": 4, "h": 3}}
]}', 'pro'),

('Minimalista', 'Dashboard limpo com métricas essenciais', 'personal',
'{"widgets": [
    {"id": "balance", "type": "NetWorthWidget", "position": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "budget", "type": "BudgetProgressWidget", "position": {"x": 0, "y": 2, "w": 6, "h": 2}},
    {"id": "goals", "type": "GoalsWidget", "position": {"x": 6, "y": 2, "w": 6, "h": 2}}
]}', null);