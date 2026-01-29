-- Migration: Ultra Security for Open Finance / Pluggy Data
-- This implements end-to-end encryption where even DB admins cannot see sensitive data

-- =============================================
-- STEP 1: Enable pgcrypto for encryption
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- STEP 2: Create encryption key storage
-- =============================================

-- Store user-specific encryption keys (encrypted themselves with a master key)
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_key TEXT NOT NULL,
    key_salt TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only service_role can access (no user access)
CREATE POLICY "service_role_only" ON user_encryption_keys
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- STEP 3: Add encrypted columns to connected_accounts
-- =============================================

-- Drop old unencrypted columns and add encrypted ones
ALTER TABLE connected_accounts
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS item_id,
DROP COLUMN IF EXISTS execution_status;

-- Add new encrypted columns
ALTER TABLE connected_accounts
ADD COLUMN IF NOT EXISTS encrypted_access_token TEXT,
ADD COLUMN IF NOT EXISTS encrypted_item_id TEXT,
ADD COLUMN IF NOT EXISTS encrypted_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;

-- =============================================
-- STEP 4: Add encrypted columns to accounts
-- =============================================

ALTER TABLE accounts
DROP COLUMN IF EXISTS balance,
DROP COLUMN IF EXISTS available_balance;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS encrypted_balance TEXT,
ADD COLUMN IF NOT EXISTS encrypted_available_balance TEXT,
ADD COLUMN IF NOT EXISTS encrypted_account_number TEXT,
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;

-- =============================================
-- STEP 5: Add encrypted columns to transactions
-- =============================================

ALTER TABLE open_finance_transactions
DROP COLUMN IF EXISTS amount,
DROP COLUMN IF EXISTS description;

ALTER TABLE open_finance_transactions
ADD COLUMN IF NOT EXISTS encrypted_amount TEXT,
ADD COLUMN IF NOT EXISTS encrypted_description TEXT,
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;

-- =============================================
-- STEP 6: Create audit table for security events
-- =============================================

CREATE TABLE IF NOT EXISTS pluggy_security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pluggy_audit_user ON pluggy_security_audit(user_id);
CREATE INDEX idx_pluggy_audit_created ON pluggy_security_audit(created_at);
CREATE INDEX idx_pluggy_audit_event ON pluggy_security_audit(event_type);

-- Enable RLS
ALTER TABLE pluggy_security_audit ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "users_view_own_audit" ON pluggy_security_audit
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "service_insert_audit" ON pluggy_security_audit
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- STEP 7: Create session tokens table
-- =============================================

-- Store temporary session tokens for Pluggy Widget
CREATE TABLE IF NOT EXISTS pluggy_session_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pluggy_session_user ON pluggy_session_tokens(user_id);
CREATE INDEX idx_pluggy_session_expires ON pluggy_session_tokens(expires_at);

-- Enable RLS
ALTER TABLE pluggy_session_tokens ENABLE ROW LEVEL SECURITY;

-- Only service_role can access
CREATE POLICY "service_role_only_session" ON pluggy_session_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

-- Auto-delete expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_pluggy_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM pluggy_session_tokens
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 8: Create rate limiting table
-- =============================================

CREATE TABLE IF NOT EXISTS pluggy_rate_limits (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, endpoint)
);

CREATE INDEX idx_pluggy_rate_user ON pluggy_rate_limits(user_id);

-- Enable RLS
ALTER TABLE pluggy_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role can access
CREATE POLICY "service_role_only_rate" ON pluggy_rate_limits
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- STEP 9: Security functions
-- =============================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_pluggy_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_request_path TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO pluggy_security_audit (
        user_id, event_type, ip_address, user_agent, 
        request_path, success, error_message, metadata
    )
    VALUES (
        p_user_id, p_event_type, p_ip_address, p_user_agent,
        p_request_path, p_success, p_error_message, p_metadata
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_pluggy_rate_limit(
    p_user_id UUID,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Get current rate limit data
    SELECT request_count, window_start
    INTO v_current_count, v_window_start
    FROM pluggy_rate_limits
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    
    -- If no record exists or window expired, create/reset
    IF v_current_count IS NULL OR v_window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
        INSERT INTO pluggy_rate_limits (user_id, endpoint, request_count, window_start)
        VALUES (p_user_id, p_endpoint, 1, NOW())
        ON CONFLICT (user_id, endpoint) 
        DO UPDATE SET request_count = 1, window_start = NOW();
        
        RETURN TRUE;
    END IF;
    
    -- Check if limit exceeded
    IF v_current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Increment counter
    UPDATE pluggy_rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 10: Update RLS policies for maximum security
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON connected_accounts;

-- Recreate with stricter policies
CREATE POLICY "users_select_connected_accounts" ON connected_accounts
    FOR SELECT
    USING (
        auth.uid() = user_id 
        AND status = 'active'
    );

CREATE POLICY "service_insert_connected_accounts" ON connected_accounts
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
    );

CREATE POLICY "service_update_connected_accounts" ON connected_accounts
    FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "users_delete_connected_accounts" ON connected_accounts
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

-- Similar for accounts table
DROP POLICY IF EXISTS "Users can view own bank accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own bank accounts" ON accounts;

CREATE POLICY "users_select_accounts" ON accounts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "service_manage_accounts" ON accounts
    FOR ALL
    USING (auth.role() = 'service_role');

-- Similar for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON open_finance_transactions;

CREATE POLICY "users_select_transactions" ON open_finance_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "service_manage_transactions" ON open_finance_transactions
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- STEP 11: Add security metadata columns
-- =============================================

ALTER TABLE connected_accounts
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_accessed_ip INET,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '{}';

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- =============================================
-- STEP 12: Create view for decrypted data (service_role only)
-- =============================================

-- Note: Actual decryption happens in Edge Functions
-- This view is just for reference
CREATE OR REPLACE VIEW connected_accounts_metadata AS
SELECT 
    id,
    user_id,
    connector_id,
    status,
    sync_status,
    last_sync_at,
    access_count,
    last_accessed_at,
    created_at,
    updated_at
FROM connected_accounts;

-- Grant select to authenticated users
GRANT SELECT ON connected_accounts_metadata TO authenticated;

-- =============================================
-- Comments for documentation
-- =============================================

COMMENT ON TABLE user_encryption_keys IS 'Stores per-user encryption keys (encrypted with master key). Only accessible by service_role.';
COMMENT ON TABLE pluggy_security_audit IS 'Audit log for all Pluggy/Open Finance security events';
COMMENT ON TABLE pluggy_session_tokens IS 'Temporary session tokens for Pluggy Widget initialization';
COMMENT ON TABLE pluggy_rate_limits IS 'Rate limiting per user per endpoint';
COMMENT ON COLUMN connected_accounts.encrypted_access_token IS 'Pluggy access token encrypted with user-specific key';
COMMENT ON COLUMN connected_accounts.encrypted_item_id IS 'Pluggy item ID encrypted with user-specific key';
COMMENT ON COLUMN accounts.encrypted_balance IS 'Account balance encrypted client-side';
COMMENT ON COLUMN accounts.encrypted_account_number IS 'Account number encrypted client-side (never shown in full)';
