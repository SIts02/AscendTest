
BEGIN;

CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  item_id TEXT NOT NULL UNIQUE,
  connector_id INTEGER NOT NULL,
  connector_name TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_sync_at TIMESTAMPTZ,
  next_auto_sync_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  pluggy_account_id TEXT NOT NULL UNIQUE,

  type TEXT NOT NULL,
  subtype TEXT,
  name TEXT NOT NULL,
  number TEXT,

  balance DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'BRL',

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  balance DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, date)
);

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS pluggy_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id),
ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON public.connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON public.connected_accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_connected ON public.accounts(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_account ON public.account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_date ON public.account_balance_history(date);
CREATE INDEX IF NOT EXISTS idx_transactions_pluggy ON public.transactions(pluggy_transaction_id) WHERE pluggy_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id) WHERE account_id IS NOT NULL;

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own balance history"
  ON public.account_balance_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance history"
  ON public.account_balance_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION get_net_worth(p_user_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  total_balance DECIMAL(15,2);
BEGIN
  SELECT COALESCE(SUM(balance), 0)
  INTO total_balance
  FROM public.accounts
  WHERE user_id = p_user_id;

  RETURN total_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;