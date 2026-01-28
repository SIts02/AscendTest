
BEGIN;

DELETE FROM public.balance_forecasts;

DELETE FROM public.financial_scenarios;

DELETE FROM public.financial_anomalies;

DELETE FROM public.investments;

DELETE FROM public.transactions;

DELETE FROM public.categories WHERE user_id IS NOT NULL;

DELETE FROM public.goals;

DELETE FROM public.budgets;

DELETE FROM public.reports;

DELETE FROM public.automations;

DELETE FROM public.profiles;

DELETE FROM auth.users;

COMMIT;

INSERT INTO public.audit_log (action, description, created_at)
VALUES ('SECURITY_CLEANUP', 'Todos os usuários foram removidos do sistema', NOW());