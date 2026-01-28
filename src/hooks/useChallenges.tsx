import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Challenge {
    id: string;
    code: string;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    duration_days: number;
    goal_type: string;
    goal_value: number | null;
    goal_metadata: any;
    points: number;
    achievement_id: string | null;
    recommended_archetypes: string[] | null;
    is_active: boolean;
}

export interface UserChallenge {
    id: string;
    user_id: string;
    challenge_id: string;
    started_at: string;
    ends_at: string;
    current_value: number;
    target_value: number;
    progress_percentage: number;
    status: 'active' | 'completed' | 'failed' | 'abandoned';
    completed_at: string | null;
    points_earned: number;
    challenge: Challenge;
}

export function useChallenges() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: availableChallenges, isLoading: isLoadingAvailable } = useQuery<Challenge[]>({
        queryKey: ['challenges'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('challenges')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            return data as Challenge[];
        },
    });

    const { data: userChallenges, isLoading: isLoadingUser } = useQuery<UserChallenge[]>({
        queryKey: ['user-challenges', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_challenges')
                .select(`
                    *,
                    challenge:challenges(*)
                `)
                .eq('user_id', user.id)
                .order('started_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
        enabled: !!user,
    });

    const startChallengeMutation = useMutation({
        mutationFn: async (challengeId: string) => {
            if (!user) throw new Error('User not authenticated');

            const challenge = availableChallenges?.find((c) => c.id === challengeId);
            if (!challenge) throw new Error('Challenge not found');

            const endsAt = new Date();
            endsAt.setDate(endsAt.getDate() + challenge.duration_days);

            const { data, error } = await supabase.from('user_challenges').insert({
                user_id: user.id,
                challenge_id: challengeId,
                target_value: challenge.goal_value || 0,
                ends_at: endsAt.toISOString(),
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Desafio iniciado!');
            queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao iniciar desafio: ${error.message}`);
        },
    });

    const updateProgressMutation = useMutation({
        mutationFn: async ({ challengeId, newValue }: { challengeId: string; newValue: number }) => {
            const { error } = await supabase.rpc('update_challenge_progress', {
                p_user_challenge_id: challengeId,
                p_new_value: newValue,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
        },
    });

    const abandonChallengeMutation = useMutation({
        mutationFn: async (challengeId: string) => {
            const { error } = await supabase
                .from('user_challenges')
                .update({ status: 'abandoned' })
                .eq('id', challengeId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Desafio abandonado');
            queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
        },
    });

    const activeChallenges = userChallenges?.filter((uc) => uc.status === 'active') || [];
    const completedChallenges = userChallenges?.filter((uc) => uc.status === 'completed') || [];

    return {
        availableChallenges: availableChallenges || [],
        userChallenges: userChallenges || [],
        activeChallenges,
        completedChallenges,
        isLoading: isLoadingAvailable || isLoadingUser,
        startChallenge: startChallengeMutation.mutate,
        isStarting: startChallengeMutation.isPending,
        updateProgress: updateProgressMutation.mutate,
        abandonChallenge: abandonChallengeMutation.mutate,
    };
}