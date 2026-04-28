import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '@/src/features/auth/lib/auth-constants';

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'יש להזין כתובת דוא"ל')
      .email('יש להזין כתובת דוא"ל תקינה'),
    full_name: z
      .string()
      .trim()
      .min(2, 'יש להזין שם מלא'),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `יש להזין סיסמה באורך ${MIN_PASSWORD_LENGTH} תווים לפחות`),
    password_confirmation: z.string().min(1, 'יש לאמת את הסיסמה'),
    requested_role: z.enum([
      'super_admin',
      'instructor',
      'machbal',
      'eshkol_officer',
      'mashkabat',
      'mepag',
      'samepag',
      'razar',
      'sarazar',
    ]),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || /^[0-9+\-() ]{8,20}$/.test(value),
        'יש להזין מספר טלפון תקין או להשאיר ריק'
      ),
    settlement_area: z
      .string()
      .trim()
      .max(80, 'יש להזין עד 80 תווים')
      .optional()
      .or(z.literal('')),
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

export type RegisterFormValues = z.infer<typeof registerSchema>;
