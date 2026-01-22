
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

          if (error && error.message.includes('not found')) {
            // No preferences stored yet, create default ones
            try {
              const { error: insertError } = await supabase
                .from('user_preferences')
                .insert({
                  ...defaultPreferences,
                  user_id: user.id
                });
                
              if (insertError) {
                console.error('Error creating default preferences:', insertError);
              } else {
                setInitialized(true);
                // Save default preferences to localStorage too
                localStorage.setItem('user_preferences', JSON.stringify(defaultPreferences));
              }
            } catch (err) {
              console.error('Failed to create default preferences:', err);
            }
          } else if (data) {
            setPreferences(data as UserPreferences);
            setInitialized(true);
            // Update localStorage with server data
            localStorage.setItem('user_preferences', JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
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
      
      // If logged in, also update in Supabase
      if (user) {
        const prefsToSave = {
          ...newPreferences,
          user_id: user.id
        };
        
        if (initialized) {
          // Update existing preferences
          const { error } = await supabase
            .from('user_preferences')
            .update({
              ...prefsToSave,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
            
          if (error) {
            throw error;
          }
        } else {
          // Insert new preferences
          const { error } = await supabase
            .from('user_preferences')
            .insert(prefsToSave);
            
          if (error) {
            throw error;
          }
          setInitialized(true);
        }
      }

      setPreferences(newPreferences);
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
