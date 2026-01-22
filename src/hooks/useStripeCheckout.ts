import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type PlanId = 'standard' | 'pro';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (planId: PlanId) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para assinar um plano');
      navigate('/login');
      return;
    }

    setLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Erro ao abrir portal de assinaturas.');
    }
  };

  return { loading, handleCheckout, handleManageSubscription };
};
