import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  rememberMe: z.boolean().optional()
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayúscula')
    .regex(/[a-z]/, 'Al menos una minúscula')
    .regex(/[0-9]/, 'Al menos un número')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/, 'Al menos un símbolo'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

export const resetPasswordSchema = z.object({
  token: z.string().length(64, 'Token inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayúscula')
    .regex(/[a-z]/, 'Al menos una minúscula')
    .regex(/[0-9]/, 'Al menos un número')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/, 'Al menos un símbolo'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayúscula')
    .regex(/[a-z]/, 'Al menos una minúscula')
    .regex(/[0-9]/, 'Al menos un número')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/, 'Al menos un símbolo'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const profileSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres').optional(),
  preferences: z.object({
    currency: z.string().length(3).optional(),
    dateFormat: z.string().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().min(2).max(5).optional()
  }).optional()
});

export const movementSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Descripción requerida').max(200, 'Máximo 200 caracteres'),
  amount: z.number().positive('Importe debe ser mayor a 0'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  accountId: z.string().min(1, 'Cuenta requerida'),
  date: z.date(),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional()
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal'),
  icon: z.string().min(1, 'Icono requerido').max(50),
  isDefault: z.boolean().optional()
});

export const accountSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  type: z.enum(['cash', 'bank', 'savings', 'debit_card', 'credit_card', 'other']),
  initialBalance: z.number().optional(),
  currency: z.string().length(3).optional(),
  creditLimit: z.number().positive().optional(),
  bankName: z.string().max(100).optional(),
  lastFourDigits: z.string().regex(/^\d{4}$/).optional(),
  description: z.string().max(500).optional()
}).refine((data) => data.type !== 'credit_card' || (data.creditLimit && data.creditLimit > 0), {
  message: 'Límite de crédito requerido para tarjetas de crédito',
  path: ['creditLimit']
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Categoría requerida'),
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive('Presupuesto debe ser mayor a 0'),
  alertThresholds: z.object({
    warning: z.number().int().min(1).max(100).default(80),
    danger: z.number().int().min(1).max(100).default(90),
    critical: z.number().int().min(1).max(100).default(100)
  }).optional()
});

export const reportFiltersSchema = z.object({
  format: z.enum(['pdf', 'excel']),
  year: z.number().int().min(2020).max(2050).optional(),
  month: z.number().int().min(1).max(12).optional(),
  type: z.enum(['income', 'expense', 'all']).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
});