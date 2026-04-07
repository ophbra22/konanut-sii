import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'יש להזין כתובת דוא"ל')
    .email('יש להזין כתובת דוא"ל תקינה'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

