import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'יש להזין סיסמה באורך 6 תווים לפחות'),
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

