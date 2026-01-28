import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  user_id: string;
  created_at: string;
}

export interface CategoryFormData {
  name: string;
  type: string;
  color?: string | null;
  icon?: string | null;
}

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories((data as unknown as Category[]) || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err);
      setError(err.message);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCategory = payload.new as Category;
            setCategories(prev => {
              if (prev.some(c => c.id === newCategory.id)) return prev;
              const updated = [...prev, newCategory];
              return updated.sort((a, b) => a.name.localeCompare(b.name));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedCategory = payload.new as Category;
            setCategories(prev =>
              prev.map(c => c.id === updatedCategory.id ? updatedCategory : c)
                .sort((a, b) => a.name.localeCompare(b.name))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setCategories(prev => prev.filter(c => c.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addCategory = async (categoryData: CategoryFormData) => {
    if (!user) return null;

    const tempId = `temp-${Date.now()}`;
    const optimisticCategory: Category = {
      id: tempId,
      name: categoryData.name,
      type: categoryData.type,
      color: categoryData.color || null,
      icon: categoryData.icon || null,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    setCategories(prev => {
      const updated = [...prev, optimisticCategory];
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });

    try {
      const newCategory = {
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color || null,
        icon: categoryData.icon || null,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory] as any)
        .select();

      if (error) throw error;

      const realCategory = data[0] as unknown as Category;
      setCategories(prev =>
        prev.map(c => c.id === tempId ? realCategory : c)
      );

      toast.success('Categoria criada com sucesso!');
      return realCategory;
    } catch (err: any) {

      setCategories(prev => prev.filter(c => c.id !== tempId));
      console.error('Erro ao adicionar categoria:', err);
      toast.error('Erro ao criar categoria');
      return null;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryFormData>) => {
    if (!user) return false;

    const previousCategories = [...categories];

    setCategories(prev =>
      prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...(categoryData.name !== undefined && { name: categoryData.name }),
            ...(categoryData.type !== undefined && { type: categoryData.type }),
            ...(categoryData.color !== undefined && { color: categoryData.color }),
            ...(categoryData.icon !== undefined && { icon: categoryData.icon }),
          };
        }
        return c;
      }).sort((a, b) => a.name.localeCompare(b.name))
    );

    try {
      const updateData: {
        name?: string;
        type?: string;
        color?: string | null;
        icon?: string | null
      } = {};

      if (categoryData.name !== undefined) updateData.name = categoryData.name;
      if (categoryData.type !== undefined) updateData.type = categoryData.type;
      if (categoryData.color !== undefined) updateData.color = categoryData.color;
      if (categoryData.icon !== undefined) updateData.icon = categoryData.icon;

      const { error } = await supabase
        .from('categories')
        .update(updateData as any)
        .eq('id', id as any);

      if (error) throw error;

      toast.success('Categoria atualizada com sucesso!');
      return true;
    } catch (err: any) {

      setCategories(previousCategories);
      console.error('Erro ao atualizar categoria:', err);
      toast.error('Erro ao atualizar categoria');
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return false;

    const previousCategories = [...categories];

    setCategories(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id as any);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      return true;
    } catch (err: any) {

      setCategories(previousCategories);
      console.error('Erro ao excluir categoria:', err);
      toast.error('Erro ao excluir categoria');
      return false;
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
}