import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_STORAGE_KEY = 'admin_session';

interface AdminSession {
  email: string;
  verified: boolean;
  expiresAt: number;
  issuedAt: number;
}

export function useAdminAuth() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(() => {

    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const sessionData: AdminSession = JSON.parse(atob(stored));

          if (sessionData.expiresAt > Date.now()) {
            return sessionData;
          } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (e) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }
    return null;
  });

  const isAuthenticated = session !== null && session.expiresAt > Date.now();

  const requestOTP = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-otp', {
        body: { email }
      });

      if (error) {
        console.error('Supabase function error:', error);

        if (error.message?.includes('Failed to send a request')) {
          throw new Error('Falha ao conectar com o servidor. Verifique se a função está deployada.');
        }
        throw error;
      }

      if (data?.error) {

        if (data.error.includes('Acesso negado') || data.error.includes('negado')) {
          throw new Error('IP_NOT_AUTHORIZED');
        }
        throw new Error(data.error);
      }

      toast.success('Código enviado! Verifique seu email.');
      return true;
    } catch (error: any) {
      console.error('Error requesting OTP:', error);
      if (error.message === 'IP_NOT_AUTHORIZED') {
        throw error;
      }

      let errorMessage = 'Erro ao solicitar código';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }

    if (!otp || otp.length !== 6) {
      toast.error('Código inválido');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-otp', {
        body: { email, otp }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.sessionToken && typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.sessionToken);
        const sessionData: AdminSession = JSON.parse(atob(data.sessionToken));
        setSession(sessionData);
      }

      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'Código inválido ou expirado');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setSession(null);
    toast.success('Logout realizado');
  }, []);

  return {
    isAuthenticated,
    session,
    loading,
    requestOTP,
    verifyOTP,
    logout
  };
}