
ALTER FUNCTION public.handle_new_user()
SET search_path = public;

ALTER FUNCTION public.update_updated_at_column()
SET search_path = public;

SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  COALESCE(array_to_string(p.proconfig, ', '), 'Not set') AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_new_user', 'update_updated_at_column')
ORDER BY p.proname;