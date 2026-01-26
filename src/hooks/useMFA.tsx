import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Factor, AuthenticatorAssuranceLevels } from '@supabase/supabase-js';
import { useSecureAction } from './useSecureAction';

interface MFAState {
  factors: Factor[];
  isLoading: boolean;
  isEnrolling: boolean;
  isVerifying: boolean;
  currentLevel: AuthenticatorAssuranceLevels | null;
  nextLevel: AuthenticatorAssuranceLevels | null;
  qrCode: string | null;
  secret: string | null;
  factorId: string | null;
}

export function useMFA() {
  const { executeSecurely } = useSecureAction();
  const [state, setState] = useState<MFAState>({
    factors: [],
    isLoading: true,
    isEnrolling: false,
    isVerifying: false,
    currentLevel: null,
    nextLevel: null,
    qrCode: null,
    secret: null,
    factorId: null,
  });

  // Fetch MFA factors and assurance level
  const fetchMFAStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [factorsResult, aalResult] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      ]);

      if (factorsResult.error) throw factorsResult.error;
      if (aalResult.error) throw aalResult.error;

      setState(prev => ({
        ...prev,
        factors: factorsResult.data?.totp || [],
        currentLevel: aalResult.data?.currentLevel || null,
        nextLevel: aalResult.data?.nextLevel || null,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error fetching MFA status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Only fetch MFA status on initial mount, not on visibility changes
  useEffect(() => {
    fetchMFAStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get verified factors
  const verifiedFactors = state.factors.filter(f => f.status === 'verified');
  const hasMFAEnabled = verifiedFactors.length > 0;

  // Check if user needs to verify MFA
  const needsMFAVerification = 
    state.currentLevel === 'aal1' && 
    state.nextLevel === 'aal2' && 
    hasMFAEnabled;

  // Start MFA enrollment
  const startEnrollment = async () => {
    try {
      setState(prev => ({ ...prev, isEnrolling: true }));

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'MoMoney',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
        isEnrolling: false,
      }));

      return { success: true, data };
    } catch (error: any) {
      console.error('Error starting MFA enrollment:', error);
      toast.error(error.message || 'Erro ao iniciar configuração de 2FA');
      setState(prev => ({ ...prev, isEnrolling: false }));
      return { success: false, error };
    }
  };

  // Verify and complete enrollment
  const verifyEnrollment = async (code: string) => {
    if (!state.factorId) {
      toast.error('Nenhum fator para verificar');
      return { success: false };
    }

    const result = await executeSecurely(
      {
        endpoint: 'mfa/verify-enrollment',
        action: 'mfa_enable',
        resource: 'mfa',
        maxRequests: 5,
        windowMinutes: 1
      },
      async () => {
        setState(prev => ({ ...prev, isVerifying: true }));

        try {
          // Create a challenge
          const { data: challengeData, error: challengeError } = 
            await supabase.auth.mfa.challenge({ factorId: state.factorId! });

          if (challengeError) throw challengeError;

          // Verify the code
          const { data: verifyData, error: verifyError } = 
            await supabase.auth.mfa.verify({
              factorId: state.factorId!,
              challengeId: challengeData.id,
              code,
            });

          if (verifyError) throw verifyError;

          // Reset enrollment state and refresh factors
          setState(prev => ({
            ...prev,
            qrCode: null,
            secret: null,
            factorId: null,
            isVerifying: false,
          }));

          await fetchMFAStatus();
          toast.success('Autenticação de dois fatores ativada com sucesso!');
          return { success: true };
        } catch (error: any) {
          setState(prev => ({ ...prev, isVerifying: false }));
          throw error;
        }
      },
      {}
    );

    if (result === null) {
      setState(prev => ({ ...prev, isVerifying: false }));
      return { success: false };
    }

    return result;
  };

  // Challenge and verify for login
  const challengeAndVerify = async (factorId: string, code: string) => {
    const result = await executeSecurely(
      {
        endpoint: 'mfa/challenge-verify',
        action: 'mfa_verify',
        resource: 'mfa',
        maxRequests: 5,
        windowMinutes: 1
      },
      async () => {
        setState(prev => ({ ...prev, isVerifying: true }));

        // Create a challenge
        const { data: challengeData, error: challengeError } = 
          await supabase.auth.mfa.challenge({ factorId });

        if (challengeError) throw challengeError;

        // Verify the code
        const { data: verifyData, error: verifyError } = 
          await supabase.auth.mfa.verify({
            factorId,
            challengeId: challengeData.id,
            code,
          });

        if (verifyError) throw verifyError;

        setState(prev => ({ ...prev, isVerifying: false }));
        await fetchMFAStatus();
        return { success: true };
      },
      {}
    );

    if (result === null) {
      setState(prev => ({ ...prev, isVerifying: false }));
      return { success: false };
    }

    return result;
  };

  // Unenroll a factor
  const unenrollFactor = async (factorId: string, verificationCode?: string) => {
    const result = await executeSecurely(
      {
        endpoint: 'mfa/unenroll',
        action: 'mfa_disable',
        resource: 'mfa',
        maxRequests: 3,
        windowMinutes: 1
      },
      async () => {
        // If verification code is provided, verify it first
        if (verificationCode) {
          const { data: challengeData, error: challengeError } = 
            await supabase.auth.mfa.challenge({ factorId });

          if (challengeError) throw challengeError;

          const { data: verifyData, error: verifyError } = 
            await supabase.auth.mfa.verify({
              factorId,
              challengeId: challengeData.id,
              code: verificationCode,
            });

          if (verifyError) throw verifyError;
        }

        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) throw error;

        await fetchMFAStatus();
        toast.success('Autenticação de dois fatores desativada');
        return { success: true };
      },
      { factorId }
    );

    if (result === null) {
      return { success: false };
    }

    return result;
  };

  // Cancel enrollment
  const cancelEnrollment = async () => {
    if (state.factorId) {
      try {
        // Only unenroll if factor exists and is unverified
        const response = await supabase.auth.mfa.unenroll({ factorId: state.factorId });
        if (!response.error) {
          console.log('Unverified factor removed successfully');
        }
      } catch (e) {
        console.error('Error canceling enrollment:', e);
      }
    }
    // Clear local state
    setState(prev => ({
      ...prev,
      qrCode: null,
      secret: null,
      factorId: null,
      isEnrolling: false,
      isVerifying: false,
    }));
    // Refresh status to ensure factors list is up to date
    await fetchMFAStatus();
  };

  return {
    ...state,
    hasMFAEnabled,
    verifiedFactors,
    needsMFAVerification,
    startEnrollment,
    verifyEnrollment,
    challengeAndVerify,
    unenrollFactor,
    cancelEnrollment,
    refreshStatus: fetchMFAStatus,
  };
}
