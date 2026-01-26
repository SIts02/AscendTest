import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryFormData } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryFormSchema, sanitizeString, VALIDATION_LIMITS } from '@/lib/validators';
import { toast } from 'sonner';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData?: Partial<CategoryFormData>;
  isEditing?: boolean;
}

/**
 * Form for creating and editing categories
 * Includes strict input validation following OWASP best practices
 */
export function CategoryForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData, 
  isEditing = false 
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: (initialData?.type as 'income' | 'expense' | 'investment') || 'expense',
      color: initialData?.color || null,
      icon: initialData?.icon || null,
    }
  });

  // Reset form when dialog opens with new initial data
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        type: (initialData?.type as 'income' | 'expense' | 'investment') || 'expense',
        color: initialData?.color || null,
        icon: initialData?.icon || null,
      });
    }
  }, [open, initialData, form]);

  /**
   * Handle form submission with validation and sanitization
   */
  const handleSubmit = async (data: z.infer<typeof categoryFormSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Sanitize string inputs before saving
      const sanitizedData: CategoryFormData = {
        name: sanitizeString(data.name.trim()),
        type: data.type,
        color: data.color?.trim() || null,
        icon: data.icon ? sanitizeString(data.icon.trim()) : null,
      };
      
      await onSubmit(sanitizedData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle dialog close - reset form
   */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  /**
   * Validate color format
   */
  const isValidColor = (color: string): boolean => {
    if (!color) return true;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome da categoria" 
                      {...field}
                      maxLength={50}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 50);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Type field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="income">Entrada</SelectItem>
                      <SelectItem value="expense">Saída</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Color field */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Cor (ex: #ff5555)" 
                        {...field} 
                        value={field.value || ''} 
                        maxLength={7}
                        onChange={(e) => {
                          // Only allow valid hex color characters
                          const value = e.target.value.replace(/[^#A-Fa-f0-9]/g, '').slice(0, 7);
                          field.onChange(value || null);
                        }}
                      />
                      {field.value && isValidColor(field.value) && (
                        <div 
                          className="w-10 h-10 rounded border flex-shrink-0" 
                          style={{ backgroundColor: field.value }}
                          aria-label={`Cor selecionada: ${field.value}`}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Icon field */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome do ícone" 
                      {...field} 
                      value={field.value || ''} 
                      maxLength={50}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 50);
                        field.onChange(value || null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="clean" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Atualizando...' : 'Salvando...'}
                  </>
                ) : (
                  isEditing ? 'Atualizar' : 'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
