import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email muito longo');

// Password validation  
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(72, 'Senha muito longa')
  .regex(/[a-z]/, 'Senha deve conter letra minúscula')
  .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter número');

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos');

// Transaction amount validation
export const amountSchema = z
  .number()
  .min(0.01, 'Valor deve ser maior que zero')
  .max(999999999.99, 'Valor muito alto');

// Description/note validation
export const descriptionSchema = z
  .string()
  .trim()
  .max(500, 'Descrição muito longa')
  .optional();

// Login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Signup form schema
export const signupFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Transaction form schema
export const transactionFormSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  amount: amountSchema,
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  date: z.date(),
  notes: descriptionSchema,
});

// Budget form schema
export const budgetFormSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: amountSchema,
  period: z.enum(['monthly', 'weekly', 'yearly']),
});

// Goal form schema
export const goalFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  targetAmount: amountSchema,
  currentAmount: z.number().min(0, 'Valor atual não pode ser negativo'),
  deadline: z.date().optional(),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  avatar_url: z.string().url('URL inválida').optional().nullable(),
});

// Sanitize string to prevent XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return { success: false, errors: result.error };
  }

  return { success: true, data: result.data };
}
