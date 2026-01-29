import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  show_balance: boolean;
  date_format: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'pt-BR',
  currency: 'BRL',
  show_balance: true,
  date_format: 'dd/MM/yyyy',
  notifications_enabled: true,
  email_notifications: true,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);

        const localPrefs = localStorage.getItem('user_preferences');
        if (localPrefs) {
          try {
            const parsed = JSON.parse(localPrefs);

            if (parsed && typeof parsed === 'object') {
              const safePrefs: Partial<UserPreferences> = {
                theme: ['light', 'dark', 'system'].includes(parsed.theme) ? parsed.theme : defaultPreferences.theme,
                language: typeof parsed.language === 'string' ? parsed.language : defaultPreferences.language,
                currency: typeof parsed.currency === 'string' ? parsed.currency : defaultPreferences.currency,
                show_balance: typeof parsed.show_balance === 'boolean' ? parsed.show_balance : defaultPreferences.show_balance,
                date_format: typeof parsed.date_format === 'string' ? parsed.date_format : defaultPreferences.date_format,
                notifications_enabled: typeof parsed.notifications_enabled === 'boolean' ? parsed.notifications_enabled : defaultPreferences.notifications_enabled,
                email_notifications: typeof parsed.email_notifications === 'boolean' ? parsed.email_notifications : defaultPreferences.email_notifications,
              };
              setPreferences({ ...defaultPreferences, ...safePrefs });
            }
          } catch (parseError) {
            console.warn('Error parsing localStorage preferences, using defaults:', parseError);

            localStorage.removeItem('user_preferences');
          }
        }

        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {

            setPreferences(data as UserPreferences);
            setInitialized(true);

            localStorage.setItem('user_preferences', JSON.stringify(data));
          } else if (error && error.code === 'PGRST116') {

            setInitialized(false);
          } else {

            setInitialized(false);
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setInitialized(false);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  const savePreferences = async (newPreferences: UserPreferences): Promise<boolean> => {
    try {
      setSaving(true);

      localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);

      if (user) {
        const prefsToSave = {
          theme: newPreferences.theme,
          language: newPreferences.language,
          currency: newPreferences.currency,
          show_balance: newPreferences.show_balance,
          date_format: newPreferences.date_format,
          notifications_enabled: newPreferences.notifications_enabled,
          email_notifications: newPreferences.email_notifications,
          updated_at: new Date().toISOString()
        };

        console.log('Saving preferences for user:', user.id, prefsToSave);

        const { data: existing, error: fetchError } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching existing preferences:', fetchError);
          throw fetchError;
        }

        if (existing?.id) {

          const { error: updateError } = await supabase
            .from('user_preferences')
            .update(prefsToSave)
            .eq('id', existing.id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
          console.log('Preferences updated successfully');
        } else {

          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              ...prefsToSave
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }
          console.log('Preferences inserted successfully');
        }

        setInitialized(true);
      } else {
        console.warn('User not authenticated, preferences saved to localStorage only');
      }

      toast.success('Preferências salvas com sucesso');
      return true;
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao salvar suas preferências: ' + (error.message || 'Erro desconhecido'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    setPreferences,
    savePreferences,
    loading,
    saving,
    initialized
  };
}