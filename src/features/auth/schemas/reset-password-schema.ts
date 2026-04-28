import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '@/src/features/auth/lib/auth-constants';

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `יש להזין סיסמה באורך ${MIN_PASSWORD_LENGTH} תווים לפחות`),
    password_confirmation: z.string().min(1, 'יש לאמת את הסיסמה'),
  })
  .superRefine((values, context) => {
    if (values.password !== values.password_confirmation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'אימות הסיסמה אינו תואם',
        path: ['password_confirmation'],
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
