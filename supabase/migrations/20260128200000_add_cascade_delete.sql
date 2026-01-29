-- Migration: Add ON DELETE CASCADE to all user foreign keys
-- This allows complete user deletion from the database

-- =============================================
-- PROFILES TABLE
-- =============================================

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- =============================================
-- USER_PREFERENCES TABLE
-- =============================================

ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- BUDGETS TABLE
-- =============================================

ALTER TABLE budgets
DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;

ALTER TABLE budgets
ADD CONSTRAINT budgets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- FINANCIAL_GOALS TABLE
-- =============================================

ALTER TABLE financial_goals
DROP CONSTRAINT IF EXISTS financial_goals_user_id_fkey;

ALTER TABLE financial_goals
ADD CONSTRAINT financial_goals_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- INVESTMENTS TABLE
-- =============================================

ALTER TABLE investments
DROP CONSTRAINT IF EXISTS investments_user_id_fkey;

ALTER TABLE investments
ADD CONSTRAINT investments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_ROLES TABLE
-- =============================================

ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- AUDIT_LOGS TABLE
-- =============================================

ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_FEEDBACK TABLE
-- =============================================

ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_user_id_fkey;

ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- RECURRING_TRANSACTIONS TABLE
-- =============================================

ALTER TABLE recurring_transactions
DROP CONSTRAINT IF EXISTS recurring_transactions_user_id_fkey;

ALTER TABLE recurring_transactions
ADD CONSTRAINT recurring_transactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- TRANSACTION_TEMPLATES TABLE
-- =============================================

ALTER TABLE transaction_templates
DROP CONSTRAINT IF EXISTS transaction_templates_user_id_fkey;

ALTER TABLE transaction_templates
ADD CONSTRAINT transaction_templates_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- CATEGORIZATION_RULES TABLE
-- =============================================

ALTER TABLE categorization_rules
DROP CONSTRAINT IF EXISTS categorization_rules_user_id_fkey;

ALTER TABLE categorization_rules
ADD CONSTRAINT categorization_rules_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_ALERTS TABLE
-- =============================================

ALTER TABLE user_alerts
DROP CONSTRAINT IF EXISTS user_alerts_user_id_fkey;

ALTER TABLE user_alerts
ADD CONSTRAINT user_alerts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- ALERT_HISTORY TABLE
-- =============================================

ALTER TABLE alert_history
DROP CONSTRAINT IF EXISTS alert_history_user_id_fkey;

ALTER TABLE alert_history
ADD CONSTRAINT alert_history_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- REPORT_TEMPLATES TABLE
-- =============================================

ALTER TABLE report_templates
DROP CONSTRAINT IF EXISTS report_templates_user_id_fkey;

ALTER TABLE report_templates
ADD CONSTRAINT report_templates_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- SAVED_REPORTS TABLE
-- =============================================

ALTER TABLE saved_reports
DROP CONSTRAINT IF EXISTS saved_reports_user_id_fkey;

ALTER TABLE saved_reports
ADD CONSTRAINT saved_reports_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- REPORT_SCHEDULES TABLE
-- =============================================

ALTER TABLE report_schedules
DROP CONSTRAINT IF EXISTS report_schedules_user_id_fkey;

ALTER TABLE report_schedules
ADD CONSTRAINT report_schedules_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- MESSAGES TABLE
-- =============================================

ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- CONVERSATIONS TABLE
-- =============================================

ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- FORECASTS TABLE (Sprint 1)
-- =============================================

ALTER TABLE forecasts
DROP CONSTRAINT IF EXISTS forecasts_user_id_fkey;

ALTER TABLE forecasts
ADD CONSTRAINT forecasts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- ANOMALIES TABLE (Sprint 1)
-- =============================================

ALTER TABLE anomalies
DROP CONSTRAINT IF EXISTS anomalies_user_id_fkey;

ALTER TABLE anomalies
ADD CONSTRAINT anomalies_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- CONNECTED_ACCOUNTS TABLE (Open Finance)
-- =============================================

ALTER TABLE connected_accounts
DROP CONSTRAINT IF EXISTS connected_accounts_user_id_fkey;

ALTER TABLE connected_accounts
ADD CONSTRAINT connected_accounts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- ACCOUNTS TABLE (Open Finance)
-- =============================================

ALTER TABLE accounts
DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;

ALTER TABLE accounts
ADD CONSTRAINT accounts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- OPEN_FINANCE_TRANSACTIONS TABLE
-- =============================================

ALTER TABLE open_finance_transactions
DROP CONSTRAINT IF EXISTS open_finance_transactions_user_id_fkey;

ALTER TABLE open_finance_transactions
ADD CONSTRAINT open_finance_transactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_SUBSCRIPTIONS TABLE (Sprint 2)
-- =============================================

ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- PAYMENT_HISTORY TABLE (Sprint 2)
-- =============================================

ALTER TABLE payment_history
DROP CONSTRAINT IF EXISTS payment_history_user_id_fkey;

ALTER TABLE payment_history
ADD CONSTRAINT payment_history_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- PSYCHOLOGICAL_PROFILES TABLE (Sprint 3)
-- =============================================

ALTER TABLE psychological_profiles
DROP CONSTRAINT IF EXISTS psychological_profiles_user_id_fkey;

ALTER TABLE psychological_profiles
ADD CONSTRAINT psychological_profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_ACHIEVEMENTS TABLE (Sprint 3)
-- =============================================

ALTER TABLE user_achievements
DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;

ALTER TABLE user_achievements
ADD CONSTRAINT user_achievements_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_CHALLENGES TABLE (Sprint 3)
-- =============================================

ALTER TABLE user_challenges
DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey;

ALTER TABLE user_challenges
ADD CONSTRAINT user_challenges_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- BEHAVIORAL_TRIGGERS TABLE (Sprint 3)
-- =============================================

ALTER TABLE behavioral_triggers
DROP CONSTRAINT IF EXISTS behavioral_triggers_user_id_fkey;

ALTER TABLE behavioral_triggers
ADD CONSTRAINT behavioral_triggers_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- FINANCIAL_GOALS_PROGRESS TABLE (Sprint 3)
-- =============================================

ALTER TABLE financial_goals_progress
DROP CONSTRAINT IF EXISTS financial_goals_progress_user_id_fkey;

ALTER TABLE financial_goals_progress
ADD CONSTRAINT financial_goals_progress_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- USER_DASHBOARDS TABLE (Sprint 4)
-- =============================================

ALTER TABLE user_dashboards
DROP CONSTRAINT IF EXISTS user_dashboards_user_id_fkey;

ALTER TABLE user_dashboards
ADD CONSTRAINT user_dashboards_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- DASHBOARD_WIDGETS TABLE (Sprint 4)
-- =============================================

ALTER TABLE dashboard_widgets
DROP CONSTRAINT IF EXISTS dashboard_widgets_user_id_fkey;

ALTER TABLE dashboard_widgets
ADD CONSTRAINT dashboard_widgets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- =============================================
-- VERIFICATION
-- =============================================

COMMENT ON TABLE profiles IS 'User profiles with ON DELETE CASCADE';
COMMENT ON TABLE user_preferences IS 'User preferences with ON DELETE CASCADE';
COMMENT ON TABLE transactions IS 'Transactions with ON DELETE CASCADE';
COMMENT ON TABLE budgets IS 'Budgets with ON DELETE CASCADE';
COMMENT ON TABLE financial_goals IS 'Financial goals with ON DELETE CASCADE';
COMMENT ON TABLE investments IS 'Investments with ON DELETE CASCADE';
COMMENT ON TABLE user_roles IS 'User roles with ON DELETE CASCADE';
COMMENT ON TABLE audit_logs IS 'Audit logs with ON DELETE CASCADE';
COMMENT ON TABLE user_subscriptions IS 'Subscriptions with ON DELETE CASCADE';
COMMENT ON TABLE psychological_profiles IS 'Psychology profiles with ON DELETE CASCADE';
COMMENT ON TABLE user_achievements IS 'Achievements with ON DELETE CASCADE';
COMMENT ON TABLE user_dashboards IS 'Custom dashboards with ON DELETE CASCADE';
