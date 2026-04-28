import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '@/src/features/auth/lib/auth-constants';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'יש להזין כתובת דוא"ל')
    .email('יש להזין כתובת דוא"ל תקינה'),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `יש להזין סיסמה באורך ${MIN_PASSWORD_LENGTH} תווים לפחות`),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
