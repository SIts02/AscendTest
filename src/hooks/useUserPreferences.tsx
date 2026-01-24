
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

  // Load preferences from localStorage or Supabase
  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        
        // First, try to load from localStorage for immediate feedback
        const localPrefs = localStorage.getItem('user_preferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
        }
        
        // If user is authenticated, load from Supabase
        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            // Preferences exist
            setPreferences(data as UserPreferences);
            setInitialized(true);
            // Update localStorage with server data
            localStorage.setItem('user_preferences', JSON.stringify(data));
          } else if (error && error.code === 'PGRST116') {
            // No preferences stored yet (PGRST116 = no rows found)
            setInitialized(false);
          } else {
            // Some other error, mark as not initialized so we can try to create on save
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

  // Save preferences to Supabase and localStorage
  const savePreferences = async (newPreferences: UserPreferences): Promise<boolean> => {
    try {
      setSaving(true);
      
      // Always update localStorage for immediate feedback
      localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      
      // If logged in, also update in Supabase
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
        
        // First check if preferences already exist
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
          // UPDATE if exists
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
          // INSERT if not exists
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
