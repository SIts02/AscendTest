
CREATE TABLE IF NOT EXISTS public.balance_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  forecast_date DATE NOT NULL,
  projected_balance DECIMAL(15, 2) NOT NULL,
  confidence_level DECIMAL(3, 2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  calculation_date TIMESTAMPTZ DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, forecast_date)
);

CREATE INDEX idx_forecasts_user_date ON public.balance_forecasts(user_id, forecast_date);
CREATE INDEX idx_forecasts_calculation ON public.balance_forecasts(calculation_date DESC);

ALTER TABLE public.balance_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own forecasts"
  ON public.balance_forecasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forecasts"
  ON public.balance_forecasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forecasts"
  ON public.balance_forecasts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.financial_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  scenario_date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('one-time', 'installments')),
  installments INTEGER CHECK (installments > 0),
  impact_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scenarios_user ON public.financial_scenarios(user_id, created_at DESC);

ALTER TABLE public.financial_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scenarios"
  ON public.financial_scenarios FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON public.financial_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.financial_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  anomaly_type TEXT CHECK (anomaly_type IN ('spike', 'unusual_category', 'missing_expected', 'low_balance')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  historical_avg DECIMAL(15, 2),
  current_value DECIMAL(15, 2),
  deviation_percentage DECIMAL(5, 2),
  suggested_action TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_anomalies_user ON public.financial_anomalies(user_id, detected_at DESC);
CREATE INDEX idx_anomalies_unacknowledged ON public.financial_anomalies(user_id, severity)
  WHERE NOT is_acknowledged;

ALTER TABLE public.financial_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own anomalies"
  ON public.financial_anomalies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge their anomalies"
  ON public.financial_anomalies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert anomalies"
  ON public.financial_anomalies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_current_balance(p_user_id UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_balance DECIMAL(15, 2);
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
  INTO v_balance
  FROM public.transactions
  WHERE user_id = p_user_id AND status = 'completed';

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_category_average(
  p_user_id UUID,
  p_category_id UUID,
  p_months INTEGER DEFAULT 3
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_average DECIMAL(15, 2);
BEGIN
  SELECT
    COALESCE(AVG(amount), 0)
  INTO v_average
  FROM public.transactions
  WHERE
    user_id = p_user_id
    AND category_id = p_category_id
    AND type = 'expense'
    AND date >= CURRENT_DATE - (p_months || ' months')::INTERVAL;

  RETURN v_average;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.balance_forecasts IS 'Armazena projeções de saldo futuro calculadas pelo algoritmo de forecasting';
COMMENT ON TABLE public.financial_scenarios IS 'Cenários "E Se?" criados pelo usuário para simular impacto de despesas';
COMMENT ON TABLE public.financial_anomalies IS 'Anomalias detectadas pela IA (gastos fora do padrão)';