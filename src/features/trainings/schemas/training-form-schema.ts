import { z } from 'zod';

import { trainingStatuses, trainingTypes } from '@/src/features/trainings/constants';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const trainingFormSchema = z.object({
  instructor_id: z.string().optional(),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  settlement_ids: z.array(z.string()).min(1, 'יש לבחור לפחות יישוב אחד'),
  status: z.enum(trainingStatuses),
  title: z.string().trim().min(2, 'יש להזין כותרת אימון'),
  training_date: z
    .string()
    .regex(dateRegex, 'יש להזין תאריך בפורמט YYYY-MM-DD'),
  training_time: z
    .string()
    .optional()
    .refine((value) => !value || timeRegex.test(value), 'יש להזין שעה בפורמט HH:MM'),
  training_type: z.enum(trainingTypes),
});

export type TrainingFormValues = z.infer<typeof trainingFormSchema>;
