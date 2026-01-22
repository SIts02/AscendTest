-- Create rate_limits table if not exists (already exists, but ensure proper structure)
-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Create a secure rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Calculate window start
  v_window_start := date_trunc('hour', NOW()) + 
    (EXTRACT(minute FROM NOW())::INTEGER / p_window_minutes) * (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Delete old records (cleanup)
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint) 
  DO UPDATE SET 
    request_count = CASE 
      WHEN rate_limits.window_start < v_window_start THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE 
      WHEN rate_limits.window_start < v_window_start THEN v_window_start
      ELSE rate_limits.window_start
    END
  RETURNING request_count INTO v_current_count;
  
  -- Check if rate limit exceeded
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (via functions)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create secure audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource, metadata)
  VALUES (auth.uid(), p_action, p_resource, p_metadata)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Add unique constraint on rate_limits if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rate_limits_user_endpoint_key'
  ) THEN
    ALTER TABLE public.rate_limits 
    ADD CONSTRAINT rate_limits_user_endpoint_key UNIQUE (user_id, endpoint);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);