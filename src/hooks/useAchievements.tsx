import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    requirement_type: string;
    requirement_value: number | null;
    points: number;
    badge_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    badge_icon: string | null;
    is_secret: boolean;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    progress: number;
    is_completed: boolean;
    completed_at: string | null;
    notified: boolean;
    created_at: string;
    achievement: Achievement;
}

export function useAchievements() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: allAchievements, isLoading: isLoadingAll } = useQuery<Achievement[]>({
        queryKey: ['achievements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;
            return data as Achievement[];
        },
    });

    const { data: userAchievements, isLoading: isLoadingUser } = useQuery<UserAchievement[]>({
        queryKey: ['user-achievements', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_achievements')
                .select(`
                    *,
                    achievement:achievements(*)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
        enabled: !!user,
    });

    const { data: totalPoints } = useQuery<number>({
        queryKey: ['achievement-points', user?.id],
        queryFn: async () => {
            if (!user) return 0;

            const { data, error } = await supabase.rpc('get_user_achievement_points', {
                p_user_id: user.id,
            });

            if (error) throw error;
            return data || 0;
        },
        enabled: !!user,
    });

    const markAsNotifiedMutation = useMutation({
        mutationFn: async (achievementId: string) => {
            const { error } = await supabase
                .from('user_achievements')
                .update({ notified: true })
                .eq('id', achievementId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        },
    });

    const checkAchievementsMutation = useMutation({
        mutationFn: async (category: string) => {
            if (!user) return [];

            const { data, error } = await supabase.rpc('check_achievements', {
                p_user_id: user.id,
                p_category: category,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        },
    });

    const completedCount = userAchievements?.filter((ua) => ua.is_completed).length || 0;
    const totalCount = allAchievements?.length || 0;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const unnotifiedAchievements = userAchievements?.filter(
        (ua) => ua.is_completed && !ua.notified
    ) || [];

    return {
        allAchievements: allAchievements || [],
        userAchievements: userAchievements || [],
        totalPoints: totalPoints || 0,
        completedCount,
        totalCount,
        completionRate,
        unnotifiedAchievements,
        isLoading: isLoadingAll || isLoadingUser,
        markAsNotified: markAsNotifiedMutation.mutate,
        checkAchievements: checkAchievementsMutation.mutate,
    };
}