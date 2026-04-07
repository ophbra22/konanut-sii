import { z } from 'zod';

import { professionalContentTypes } from '@/src/features/professional-content/constants';

function isValidUrl(value: string) {
  return z.string().url().safeParse(value).success;
}

export const professionalContentFormSchema = z
  .object({
    content_type: z.enum(professionalContentTypes, 'יש לבחור סוג תוכן'),
    description: z.string().trim().optional(),
    is_active: z.boolean(),
    thumbnail_url: z.string().trim().optional(),
    title: z.string().trim().min(2, 'יש להזין כותרת תוכן'),
    topic: z.string().trim().optional(),
    url: z.string().trim().min(1, 'יש להזין קישור לתוכן'),
  })
  .superRefine((values, context) => {
    if (!isValidUrl(values.url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'יש להזין קישור תקין',
        path: ['url'],
      });
    }

    if (values.thumbnail_url && !isValidUrl(values.thumbnail_url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'יש להזין קישור תמונה תקין',
        path: ['thumbnail_url'],
      });
    }
  });

export type ProfessionalContentFormValues = z.infer<
  typeof professionalContentFormSchema
>;
