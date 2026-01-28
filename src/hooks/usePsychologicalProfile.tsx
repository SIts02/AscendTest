import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FinancialArchetype = 'descobridor' | 'construtor' | 'protetor' | 'aventureiro' | 'planejador';
export type PrimaryMotivator = 'security' | 'freedom' | 'growth' | 'status' | 'experience';

export interface PsychologicalProfile {
    id: string;
    user_id: string;
    archetype: FinancialArchetype;
    archetype_scores: Record<FinancialArchetype, number>;
    risk_tolerance: number;
    spending_impulse: number;
    saving_discipline: number;
    goal_orientation: number;
    prefers_challenges: boolean;
    prefers_nudges: boolean;
    nudge_frequency: 'low' | 'moderate' | 'high';
    primary_motivator: PrimaryMotivator;
    last_quiz_at: string | null;
    confidence_score: number;
    created_at: string;
    updated_at: string;
}

export function usePsychologicalProfile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery<PsychologicalProfile | null>({
        queryKey: ['psychological-profile', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('psychological_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return data as PsychologicalProfile;
        },
        enabled: !!user,
    });

    const saveProfileMutation = useMutation({
        mutationFn: async (profileData: Partial<PsychologicalProfile>) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('psychological_profiles')
                .upsert({
                    user_id: user.id,
                    ...profileData,
                    last_quiz_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['psychological-profile'] });
        },
    });

    const updatePreferencesMutation = useMutation({
        mutationFn: async (preferences: {
            prefers_challenges?: boolean;
            prefers_nudges?: boolean;
            nudge_frequency?: 'low' | 'moderate' | 'high';
        }) => {
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('psychological_profiles')
                .update(preferences)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['psychological-profile'] });
        },
    });

    const getArchetypeInfo = (archetype: FinancialArchetype) => {
        const info = {
            descobridor: {
                title: 'Descobridor',
                description: 'Você está começando sua jornada financeira, explorando e aprendendo',
                strengths: ['Curioso', 'Disposto a aprender', 'Adaptável'],
                tips: ['Comece com orçamento simples', 'Estabeleça metas pequenas', 'Aprenda sobre investimentos básicos'],
            },
            construtor: {
                title: 'Construtor',
                description: 'Você está ativamente construindo seu patrimônio e segurança financeira',
                strengths: ['Disciplinado', 'Focado em crescimento', 'Paciente'],
                tips: ['Diversifique investimentos', 'Aumente reserva de emergência', 'Planeje longo prazo'],
            },
            protetor: {
                title: 'Protetor',
                description: 'Sua prioridade é proteger e preservar o que já conquistou',
                strengths: ['Cauteloso', 'Estratégico', 'Responsável'],
                tips: ['Mantenha bom seguro', 'Diversifique para reduzir risco', 'Revise patrimônio regularmente'],
            },
            aventureiro: {
                title: 'Aventureiro',
                description: 'Você busca crescimento acelerado e não teme riscos calculados',
                strengths: ['Corajoso', 'Visionário', 'Proativo'],
                tips: ['Equilibre risco e segurança', 'Tenha reserva sólida', 'Estude antes de investir'],
            },
            planejador: {
                title: 'Planejador',
                description: 'Você valoriza organização meticulosa e planejamento detalhado',
                strengths: ['Organizado', 'Analítico', 'Previsível'],
                tips: ['Use ferramentas de automação', 'Revise planos trimestralmente', 'Delegue execução'],
            },
        };

        return info[archetype];
    };

    return {
        profile,
        isLoading,
        hasProfile: !!profile,
        getArchetypeInfo,
        saveProfile: saveProfileMutation.mutate,
        isSaving: saveProfileMutation.isPending,
        updatePreferences: updatePreferencesMutation.mutate,
        isUpdatingPreferences: updatePreferencesMutation.isPending,
    };
}