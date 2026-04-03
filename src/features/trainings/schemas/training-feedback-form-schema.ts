import { z } from 'zod';

export const trainingFeedbackFormSchema = z.object({
  comment: z.string().max(500, 'ניתן להזין עד 500 תווים'),
  rating: z
    .number()
    .int('יש לבחור דירוג שלם')
    .min(1, 'יש לבחור דירוג בין 1 ל-5')
    .max(5, 'יש לבחור דירוג בין 1 ל-5'),
  settlement_id: z.string().min(1, 'יש לבחור יישוב משויך לאימון'),
});

export type TrainingFeedbackFormValues = z.infer<typeof trainingFeedbackFormSchema>;
