import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSecureAction } from './useSecureAction';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  deadline: string | null;
  icon: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  name: string;
  category: string;
  target: number;
  current?: number;
  deadline?: string | null;
  icon?: string | null;
}

export interface UpdateGoalInput {
  id: string;
  name?: string;
  category?: string;
  target?: number;
  current?: number;
  deadline?: string | null;
  icon?: string | null;
  status?: string;
}

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { executeSecurely } = useSecureAction();

  const {
    data: goals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Goal[];
    },
    enabled: !!user?.id,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const result = await executeSecurely(
        {
          endpoint: 'goals/create',
          action: 'goal_create',
          resource: 'goal',
          maxRequests: 20,
          windowMinutes: 1
        },
        async () => {
          const { data, error } = await supabase
            .from('goals')
            .insert({
              user_id: user.id,
              name: input.name,
              category: input.category,
              target: input.target,
              current: input.current || 0,
              deadline: input.deadline || null,
              icon: input.icon || null,
              status: 'em andamento',
            })
            .select()
            .single();

          if (error) throw error;
          return data as Goal;
        },
        { goalName: input.name, target: input.target }
      );

      if (result === null) throw new Error('Operação bloqueada por rate limit');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast.success('Meta criada com sucesso!');
    },
    onError: (error: Error) => {
      if (!error.message.includes('rate limit')) {
        toast.error(`Erro ao criar meta: ${error.message}`);
      }
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const result = await executeSecurely(
        {
          endpoint: 'goals/update',
          action: 'goal_update',
          resource: 'goal',
          maxRequests: 30,
          windowMinutes: 1
        },
        async () => {
          const { id, ...updateData } = input;

          const goalToUpdate = goals.find(g => g.id === id);
          if (goalToUpdate && updateData.current !== undefined) {
            const newCurrent = updateData.current;
            const target = updateData.target || goalToUpdate.target;
            if (newCurrent >= target) {
              updateData.status = 'concluída';
            }
          }

          const { data, error } = await supabase
            .from('goals')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;
          return data as Goal;
        },
        { goalId: input.id }
      );

      if (result === null) throw new Error('Operação bloqueada por rate limit');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error: Error) => {
      if (!error.message.includes('rate limit')) {
        toast.error(`Erro ao atualizar meta: ${error.message}`);
      }
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const result = await executeSecurely(
        {
          endpoint: 'goals/delete',
          action: 'goal_delete',
          resource: 'goal',
          maxRequests: 10,
          windowMinutes: 1
        },
        async () => {
          const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', goalId)
            .eq('user_id', user.id);

          if (error) throw error;
          return goalId;
        },
        { goalId }
      );

      if (result === null) throw new Error('Operação bloqueada por rate limit');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast.success('Meta excluída com sucesso!');
    },
    onError: (error: Error) => {
      if (!error.message.includes('rate limit')) {
        toast.error(`Erro ao excluir meta: ${error.message}`);
      }
    },
  });

  const updateProgress = async (goalId: string, newCurrent: number) => {

    queryClient.setQueryData(['goals', user?.id], (oldGoals: Goal[] | undefined) => {
      if (!oldGoals) return oldGoals;
      return oldGoals.map((goal) => {
        if (goal.id === goalId) {
          const progress = (newCurrent / goal.target) * 100;
          return {
            ...goal,
            current: newCurrent,
            status: progress >= 100 ? 'concluída' : goal.status,
          };
        }
        return goal;
      });
    });

    updateGoalMutation.mutate({ id: goalId, current: newCurrent });
  };

  const activeGoals = goals.filter((g) => g.status !== 'concluída');
  const completedGoals = goals.filter((g) => g.status === 'concluída');
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.current, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoading,
    error,
    refetch,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    updateProgress,
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    stats: {
      totalGoals: goals.length,
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      totalTarget,
      totalCurrent,
      overallProgress,
    },
  };
}