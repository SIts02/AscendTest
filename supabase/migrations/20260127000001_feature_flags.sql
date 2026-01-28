
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.feature_flags (name, enabled, description, rollout_percentage) VALUES
  ('FORECASTING', false, 'Módulo de Inteligência Preditiva - Forecasting de saldo', 0),
  ('OPEN_FINANCE', false, 'Hub de Conectividade Open Finance - Integração bancária', 0),
  ('SUBSCRIPTION_MANAGER', false, 'Gestão de Assinaturas - Detecção e alertas', 0),
  ('BILLING_ACTIONS', false, 'Camada de Ação e Cobrança - Emissão de boletos/Pix', 0),
  ('PSYCHOLOGY_NUDGES', false, 'Psicologia Econômica - Nudges e envelopes', 0),
  ('CUSTOM_DASHBOARDS', false, 'Dashboards Customizáveis - Drag and drop widgets', 0)
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.feature_flags IS 'Sistema de feature flags para controle de rollout de novas funcionalidades';
COMMENT ON COLUMN public.feature_flags.rollout_percentage IS 'Percentual de usuários que terão acesso (0-100). 0 = desabilitado, 100 = todos';