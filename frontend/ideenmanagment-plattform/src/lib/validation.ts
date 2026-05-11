import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Mindestens 8 Zeichen')
  .regex(/[A-Z]/, 'Mindestens 1 Großbuchstabe')
  .regex(/[a-z]/, 'Mindestens 1 Kleinbuchstabe')
  .regex(/\d/, 'Mindestens 1 Ziffer')
  .regex(/[^A-Za-z0-9]/, 'Mindestens 1 Sonderzeichen');

export const userNameSchema = z
  .string()
  .min(3, 'Mindestens 3 Zeichen')
  .max(50, 'Maximal 50 Zeichen')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Nur Buchstaben, Ziffern, . _ -');

export const emailSchema = z.string().email('Ungültige E-Mail').max(256);

export const nameSchema = z.string().min(1, 'Pflichtfeld').max(100);

export const loginSchema = z.object({
  emailOrUserName: z.string().min(1, 'Pflichtfeld'),
  password: z.string().min(1, 'Pflichtfeld'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  userName: userNameSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, 'Token fehlt'),
  newPassword: passwordSchema,
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Pflichtfeld'),
  newPassword: passwordSchema,
});
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const ideaSchema = z.object({
  title: z.string().min(5, 'Mindestens 5 Zeichen').max(150),
  description: z.string().min(10, 'Mindestens 10 Zeichen').max(10000),
  categoryId: z.string().uuid('Kategorie wählen').or(z.string().min(1, 'Kategorie wählen')),
});
export type IdeaFormValues = z.infer<typeof ideaSchema>;

export const commentSchema = z.object({
  content: z.string().min(1).max(2000, 'Maximal 2000 Zeichen'),
  parentCommentId: z.string().nullable().optional(),
});
export type CommentFormValues = z.infer<typeof commentSchema>;

export const rejectSchema = z.object({
  reason: z.string().min(5, 'Mindestens 5 Zeichen').max(1000),
});
export type RejectFormValues = z.infer<typeof rejectSchema>;

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const roleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).nullable().optional(),
});
export type RoleFormValues = z.infer<typeof roleSchema>;

// File-Upload-Konstanten
export const ALLOWED_UPLOAD_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

