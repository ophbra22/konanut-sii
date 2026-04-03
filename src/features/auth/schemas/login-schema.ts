import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'יש להזין כתובת דוא"ל')
    .email('יש להזין כתובת דוא"ל תקינה'),
  password: z
    .string()
    .min(6, 'יש להזין סיסמה באורך 6 תווים לפחות'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
