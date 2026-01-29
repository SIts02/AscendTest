import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Plan = 'basic' | 'standard' | 'pro';

interface SubscriptionInfo {
  subscribed: boolean;
  plan: Plan;
  subscription_end: string | null;
}

interface AuthResult {
  error: AuthError | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscription: SubscriptionInfo;
  checkSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;

  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}

const defaultSubscription: SubscriptionInfo = {
  subscribed: false,
  plan: 'basic',
  subscription_end: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const logAuthEvent = (action: string, userId: string | undefined, metadata?: Record<string, unknown>) => {
  console.debug('[Audit]', {
    userId: userId || 'anonymous',
    action,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription);
  const navigate = useNavigate();

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription(defaultSubscription);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data) {
        setSubscription({
          subscribed: data.subscribed,
          plan: data.plan || 'basic',
          subscription_end: data.subscription_end,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [session?.access_token]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) checkSubscription();
    else setSubscription(defaultSubscription);
  }, [session, checkSubscription]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => checkSubscription(), 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      logAuthEvent('login', data.user?.id, { method: 'email', success: true });

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];
      const needsMFA = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2' && verifiedFactors.length > 0;

      toast.success('Login realizado com sucesso!');

      setTimeout(() => {
        if (needsMFA) window.location.href = '/#/mfa-verify';
        else window.location.href = '/#/dashboard';
      }, 300);
    } catch (error: any) {
      logAuthEvent('login', undefined, { method: 'email', success: false, error: error.message });
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } }
      });
      if (error) throw error;
      if (data?.user) {
        logAuthEvent('signup', data.user.id, { method: 'email', success: true });
        toast.success('Cadastro realizado com sucesso!');
        navigate('/login');
      }
    } catch (error: any) {
      logAuthEvent('signup', undefined, { method: 'email', success: false, error: error.message });
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const userId = user?.id;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      try {
        localStorage.removeItem('user_preferences');

      } catch (storageError) {
        console.warn('Error clearing localStorage on logout:', storageError);

      }

      logAuthEvent('logout', userId, { success: true });
      setSubscription(defaultSubscription);
      navigate('/login');
      toast.success('Você saiu da sua conta');
    } catch (error: any) {
      logAuthEvent('logout', user?.id, { success: false, error: error.message });
      toast.error(error.message || 'Erro ao sair');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      if (error) throw error;

      logAuthEvent('password_reset', undefined, { email, success: true });
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      logAuthEvent('password_reset', undefined, { email, success: false, error: error.message });
      toast.error(error.message || 'Erro ao enviar email');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {

      const state = crypto.randomUUID();
      sessionStorage.setItem('oauth_state', state);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: state,
          },

          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      logAuthEvent('login', data.user.id, { method: 'email', source: 'landing', success: true });
    } else if (error) {
      logAuthEvent('login', undefined, { method: 'email', source: 'landing', success: false, error: error.message });
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      logAuthEvent('signup', data.user.id, { method: 'email', source: 'landing', success: true });
    } else if (error) {
      logAuthEvent('signup', undefined, { method: 'email', source: 'landing', success: false, error: error.message });
    }
    return { error };
  };

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      logAuthEvent('password_reset', user?.id, { success: true });
    } else {
      logAuthEvent('password_reset', user?.id, { success: false, error: error.message });
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      session, user, loading, subscription, checkSubscription,
      signIn, signUp, signOut, resetPassword, signInWithGoogle,
      signInWithEmail, signUpWithEmail, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}