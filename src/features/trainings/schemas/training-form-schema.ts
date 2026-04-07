import { z } from 'zod';

import { trainingStatuses, trainingTypes } from '@/src/features/trainings/constants';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const trainingSettlementAttendanceSchema = z.object({
  participation_rate: z.number().int().min(0).nullable(),
  settlement_id: z.string().trim().min(1, 'חסר יישוב לשורת השתתפות'),
  settlement_name: z.string().trim().min(1, 'חסר שם יישוב'),
  total_squad_members_snapshot: z
    .number()
    .int('נתון מצבת היישוב אינו תקין')
    .min(0, 'נתון מצבת היישוב אינו תקין')
    .nullable(),
  trained_count: z
    .number()
    .int('יש להזין מספר שלם ללא שברים')
    .min(0, 'המספר לא יכול להיות שלילי'),
});

export const trainingFormSchema = z
  .object({
    instructor_id: z.string().optional(),
    location: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    settlement_attendance: z.array(trainingSettlementAttendanceSchema),
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
  })
  .superRefine((values, context) => {
    const seenSettlementIds = new Set<string>();

    values.settlement_ids.forEach((settlementId, index) => {
      if (seenSettlementIds.has(settlementId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'אותו יישוב נבחר יותר מפעם אחת',
          path: ['settlement_ids', index],
        });
        return;
      }

      seenSettlementIds.add(settlementId);
    });

    const seenAttendanceIds = new Set<string>();

    values.settlement_attendance.forEach((item, index) => {
      if (seenAttendanceIds.has(item.settlement_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'נמצאה כפילות בדיווח ההשתתפות של היישוב',
          path: ['settlement_attendance', index, 'trained_count'],
        });
      } else {
        seenAttendanceIds.add(item.settlement_id);
      }

      if (!values.settlement_ids.includes(item.settlement_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'דיווח ההשתתפות חייב להיות רק עבור יישוב שנבחר לאימון',
          path: ['settlement_attendance', index, 'trained_count'],
        });
      }

      if (
        item.total_squad_members_snapshot !== null &&
        item.trained_count > item.total_squad_members_snapshot
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'לא ניתן להזין מספר גדול מהמצבה המוגדרת ליישוב',
          path: ['settlement_attendance', index, 'trained_count'],
        });
      }
    });

    values.settlement_ids.forEach((settlementId) => {
      if (!values.settlement_attendance.some((item) => item.settlement_id === settlementId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'חסרה שורת השתתפות עבור אחד מהיישובים שנבחרו',
          path: ['settlement_attendance'],
        });
      }
    });
  });

export type TrainingFormValues = z.infer<typeof trainingFormSchema>;
