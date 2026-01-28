
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON public.alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON public.alert_history(user_id);

CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON public.contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_categorization_rules_user_id ON public.categorization_rules(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON public.financial_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category_id);

ANALYZE public.transactions;
ANALYZE public.categories;
ANALYZE public.alert_history;
ANALYZE public.contacts;
ANALYZE public.user_alerts;
ANALYZE public.categorization_rules;
ANALYZE public.financial_goals;
ANALYZE public.investments;
ANALYZE public.recurring_transactions;
ANALYZE public.user_preferences;
ANALYZE public.user_roles;