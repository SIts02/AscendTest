import { z } from 'zod';

export const VALIDATION_LIMITS = {

  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
  NAME_MIN: 2,
  NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
  SHORT_TEXT_MAX: 200,
  LONG_TEXT_MAX: 2000,
  URL_MAX: 2048,

  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 999999999.99,
  QUANTITY_MIN: 0.0001,
  QUANTITY_MAX: 999999999,
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,

  MAX_REQUESTS_PER_MINUTE: 60,
} as const;

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .max(VALIDATION_LIMITS.EMAIL_MAX, `Email deve ter no máximo ${VALIDATION_LIMITS.EMAIL_MAX} caracteres`)
  .email('Email inválido')
  .transform(val => val.toLowerCase());

export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN, `Senha deve ter pelo menos ${VALIDATION_LIMITS.PASSWORD_MIN} caracteres`)
  .max(VALIDATION_LIMITS.PASSWORD_MAX, `Senha deve ter no máximo ${VALIDATION_LIMITS.PASSWORD_MAX} caracteres`)
  .regex(/[a-z]/, 'Senha deve conter letra minúscula')
  .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter número');

export const loginPasswordSchema = z
  .string()
  .min(1, 'Senha é obrigatória')
  .max(VALIDATION_LIMITS.PASSWORD_MAX, 'Senha inválida');

export const nameSchema = z
  .string()
  .trim()
  .min(VALIDATION_LIMITS.NAME_MIN, `Nome deve ter pelo menos ${VALIDATION_LIMITS.NAME_MIN} caracteres`)
  .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`)
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos');

export const amountSchema = z
  .number()
  .min(VALIDATION_LIMITS.AMOUNT_MIN, 'Valor deve ser maior que zero')
  .max(VALIDATION_LIMITS.AMOUNT_MAX, 'Valor muito alto');

export const nonNegativeAmountSchema = z
  .number()
  .min(0, 'Valor não pode ser negativo')
  .max(VALIDATION_LIMITS.AMOUNT_MAX, 'Valor muito alto');

export const quantitySchema = z
  .number()
  .min(VALIDATION_LIMITS.QUANTITY_MIN, 'Quantidade deve ser maior que zero')
  .max(VALIDATION_LIMITS.QUANTITY_MAX, 'Quantidade muito alta');

export const descriptionSchema = z
  .string()
  .trim()
  .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Descrição deve ter no máximo ${VALIDATION_LIMITS.DESCRIPTION_MAX} caracteres`)
  .optional();

export const shortTextSchema = z
  .string()
  .trim()
  .min(1, 'Este campo é obrigatório')
  .max(VALIDATION_LIMITS.SHORT_TEXT_MAX, `Texto deve ter no máximo ${VALIDATION_LIMITS.SHORT_TEXT_MAX} caracteres`);

export const urlSchema = z
  .string()
  .trim()
  .max(VALIDATION_LIMITS.URL_MAX, 'URL muito longa')
  .url('URL inválida')
  .optional()
  .nullable();

export const colorSchema = z
  .string()
  .trim()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida (use formato #RRGGBB)')
  .optional()
  .nullable()
  .or(z.literal(''))
  .transform(val => val === '' ? null : val);

export const futureDateSchema = z
  .date()
  .min(new Date(), 'Data deve ser no futuro');

export const pastDateSchema = z
  .date()
  .max(new Date(), 'Data não pode ser no futuro');

export const dateSchema = z.date();

export const loginFormSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const transactionFormSchema = z.object({
  description: z.string()
    .trim()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(VALIDATION_LIMITS.SHORT_TEXT_MAX, `Descrição deve ter no máximo ${VALIDATION_LIMITS.SHORT_TEXT_MAX} caracteres`),
  amount: z.coerce.number()
    .refine(val => val !== 0, 'Valor não pode ser zero')
    .refine(val => Math.abs(val) <= VALIDATION_LIMITS.AMOUNT_MAX, 'Valor muito alto'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Selecione um tipo válido' })
  }),
  category_id: z.string().nullable(),
  date: z.string()
    .min(1, 'Selecione uma data')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido'),
  payment_method: z.enum(['credit', 'debit', 'cash', 'transfer', 'pix']).nullable(),
  status: z.enum(['completed', 'pending', 'scheduled'], {
    errorMap: () => ({ message: 'Selecione um status válido' })
  }),
});

export const categoryFormSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  type: z.enum(['income', 'expense', 'investment'], {
    errorMap: () => ({ message: 'Selecione um tipo válido' })
  }),
  color: colorSchema,
  icon: z.string()
    .trim()
    .max(50, 'Nome do ícone muito longo')
    .optional()
    .nullable(),
});

export const budgetFormSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: amountSchema,
  period: z.enum(['monthly', 'weekly', 'yearly'], {
    errorMap: () => ({ message: 'Selecione um período válido' })
  }),
});

export const goalFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  category: z.enum(['savings', 'travel', 'education', 'property', 'vehicle', 'other'], {
    errorMap: () => ({ message: 'Selecione uma categoria válida' })
  }),
  targetAmount: amountSchema,
  currentAmount: nonNegativeAmountSchema.optional().default(0),
  deadline: futureDateSchema,
});

export const investmentFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  type: z.enum(['stocks', 'fixed_income', 'real_estate', 'crypto', 'treasury', 'savings', 'international'], {
    errorMap: () => ({ message: 'Selecione um tipo de ativo válido' })
  }),
  amount: quantitySchema,
  purchasePrice: amountSchema,
  purchaseDate: pastDateSchema,
});

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  avatar_url: urlSchema,
});

export const feedbackFormSchema = z.object({
  type: z.enum(['bug', 'suggestion', 'praise', 'other'], {
    errorMap: () => ({ message: 'Selecione um tipo válido' })
  }),
  rating: z.number()
    .int('Avaliação deve ser um número inteiro')
    .min(1, 'Avaliação mínima é 1')
    .max(5, 'Avaliação máxima é 5'),
  message: z.string()
    .trim()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(VALIDATION_LIMITS.LONG_TEXT_MAX, `Mensagem deve ter no máximo ${VALIDATION_LIMITS.LONG_TEXT_MAX} caracteres`),
});

export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#x60;');
}

export function stripScripts(str: string): string {
  if (typeof str !== 'string') return '';

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(sanitized[key] as Record<string, unknown>);
    }
  }

  return sanitized;
}

export function stripUnexpectedFields<T extends Record<string, unknown>>(
  obj: T,
  allowedKeys: (keyof T)[]
): Partial<T> {
  const filtered: Partial<T> = {};

  for (const key of allowedKeys) {
    if (key in obj) {
      filtered[key] = obj[key];
    }
  }

  return filtered;
}

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

export function getValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

export function getFirstError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Erro de validação';
}

export function isSafeInteger(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER
): boolean {
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type TransactionFormData = z.infer<typeof transactionFormSchema>;
export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type BudgetFormData = z.infer<typeof budgetFormSchema>;
export type GoalFormData = z.infer<typeof goalFormSchema>;
export type InvestmentFormData = z.infer<typeof investmentFormSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;