import { z } from 'zod';

/**
 * Schema de validación para User
 */
export const userSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  consentAccepted: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Tipo User inferido del schema
 */
export type User = z.infer<typeof userSchema>;

/**
 * Schema para registro de usuario (sin _id, sin timestamps)
 */
export const userRegistrationSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres'
  }).max(100, {
    message: 'El nombre no puede exceder 100 caracteres'
  }),
  email: z.string().email({
    message: 'Email inválido'
  }),
  password: z.string().min(8, {
    message: 'La contraseña debe tener al menos 8 caracteres'
  }),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos de privacidad para continuar'
  })
});

export type UserRegistration = z.infer<typeof userRegistrationSchema>;

/**
 * Schema para login de usuario
 */
export const userLoginSchema = z.object({
  email: z.string().email({
    message: 'Email inválido'
  }),
  password: z.string().min(1, {
    message: 'La contraseña es requerida'
  })
});

export type UserLogin = z.infer<typeof userLoginSchema>;
