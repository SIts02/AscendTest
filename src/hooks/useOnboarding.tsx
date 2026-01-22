
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnboardingStatus {
  id: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  const fetchOnboardingStatus = async (): Promise<OnboardingStatus | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        setIsFirstLogin(true);
        return null;
      }
      console.error('Error fetching onboarding status:', error);
      throw error;
    }

    setIsFirstLogin(!data.completed);
    return data as OnboardingStatus;
  };

  const updateOnboardingStatus = async (completed: boolean): Promise<OnboardingStatus> => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_onboarding')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating onboarding status:', error);
      throw error;
    }

    setIsFirstLogin(!completed);
    return data as OnboardingStatus;
  };

  const onboardingStatusQuery = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: fetchOnboardingStatus,
    enabled: !!user?.id,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: updateOnboardingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', user?.id] });
      toast.success('Onboarding status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error updating onboarding status');
    }
  });

  return {
    isFirstLogin,
    onboardingStatus: onboardingStatusQuery.data,
    isLoading: onboardingStatusQuery.isLoading,
    completeOnboarding: () => updateOnboardingMutation.mutate(true),
    resetOnboarding: () => updateOnboardingMutation.mutate(false),
    isUpdating: updateOnboardingMutation.isPending
  };
}
