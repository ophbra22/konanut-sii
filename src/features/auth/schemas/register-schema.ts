import { z } from 'zod';

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
      .min(6, 'יש להזין סיסמה באורך 6 תווים לפחות'),
    password_confirmation: z.string().min(1, 'יש לאמת את הסיסמה'),
    requested_role: z.enum(['viewer', 'instructor', 'mashkabat', 'super_admin']),
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
