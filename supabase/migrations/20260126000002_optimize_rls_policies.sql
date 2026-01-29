
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Users can view their own categories"
ON public.categories FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
CREATE POLICY "Users can insert their own categories"
ON public.categories FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories"
ON public.categories FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories"
ON public.categories FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions"
ON public.transactions FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own alerts" ON public.user_alerts;
CREATE POLICY "Users can view their own alerts"
ON public.user_alerts FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own alerts" ON public.user_alerts;
CREATE POLICY "Users can create their own alerts"
ON public.user_alerts FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;
CREATE POLICY "Users can update their own alerts"
ON public.user_alerts FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.user_alerts;
CREATE POLICY "Users can delete their own alerts"
ON public.user_alerts FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own alert history" ON public.alert_history;
CREATE POLICY "Users can view their own alert history"
ON public.alert_history FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own alert history" ON public.alert_history;
CREATE POLICY "Users can update their own alert history"
ON public.alert_history FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (has_role((select auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role((select auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own categorization rules" ON public.categorization_rules;
CREATE POLICY "Users can view their own categorization rules"
ON public.categorization_rules FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own categorization rules" ON public.categorization_rules;
CREATE POLICY "Users can update their own categorization rules"
ON public.categorization_rules FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own categorization rules" ON public.categorization_rules;
CREATE POLICY "Users can delete their own categorization rules"
ON public.categorization_rules FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
CREATE POLICY "Users can view their own contacts"
ON public.contacts FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
CREATE POLICY "Users can update their own contacts"
ON public.contacts FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
CREATE POLICY "Users can delete their own contacts"
ON public.contacts FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own financial goals" ON public.financial_goals;
CREATE POLICY "Users can view their own financial goals"
ON public.financial_goals FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own financial goals" ON public.financial_goals;
CREATE POLICY "Users can update their own financial goals"
ON public.financial_goals FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own financial goals" ON public.financial_goals;
CREATE POLICY "Users can delete their own financial goals"
ON public.financial_goals FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
CREATE POLICY "Users can view their own investments"
ON public.investments FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
CREATE POLICY "Users can update their own investments"
ON public.investments FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;
CREATE POLICY "Users can delete their own investments"
ON public.investments FOR DELETE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view their own recurring transactions" ON public.recurring_transactions;
CREATE POLICY "Users can view their own recurring transactions"
ON public.recurring_transactions FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring transactions" ON public.recurring_transactions;
CREATE POLICY "Users can update their own recurring transactions"
ON public.recurring_transactions FOR UPDATE
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring transactions" ON public.recurring_transactions;
CREATE POLICY "Users can delete their own recurring transactions"
ON public.recurring_transactions FOR DELETE
USING ((select auth.uid()) = user_id);