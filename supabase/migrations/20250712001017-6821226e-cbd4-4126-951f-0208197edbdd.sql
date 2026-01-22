-- Create tables for automation features

-- Recurring transactions
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category_id UUID,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  frequency_interval INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_execution_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transaction templates
CREATE TABLE public.transaction_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC,
  description TEXT NOT NULL,
  category_id UUID,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  payment_method TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto categorization rules
CREATE TABLE public.categorization_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  category_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User alerts and notifications
CREATE TABLE public.user_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_limit', 'goal_milestone', 'unusual_spending', 'recurring_reminder', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_value NUMERIC,
  category_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alert history
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_transactions
CREATE POLICY "Users can view their own recurring transactions" 
ON public.recurring_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring transactions" 
ON public.recurring_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions" 
ON public.recurring_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions" 
ON public.recurring_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for transaction_templates
CREATE POLICY "Users can view their own transaction templates" 
ON public.transaction_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transaction templates" 
ON public.transaction_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transaction templates" 
ON public.transaction_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transaction templates" 
ON public.transaction_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for categorization_rules
CREATE POLICY "Users can view their own categorization rules" 
ON public.categorization_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorization rules" 
ON public.categorization_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorization rules" 
ON public.categorization_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorization rules" 
ON public.categorization_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for user_alerts
CREATE POLICY "Users can view their own alerts" 
ON public.user_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts" 
ON public.user_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.user_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" 
ON public.user_alerts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for alert_history
CREATE POLICY "Users can view their own alert history" 
ON public.alert_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert history" 
ON public.alert_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert history" 
ON public.alert_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_recurring_transactions_updated_at
BEFORE UPDATE ON public.recurring_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_templates_updated_at
BEFORE UPDATE ON public.transaction_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at
BEFORE UPDATE ON public.categorization_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_alerts_updated_at
BEFORE UPDATE ON public.user_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();