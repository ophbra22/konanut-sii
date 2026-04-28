import { z } from 'zod';

import { PLAGA_VALUES } from '@/src/lib/plaga';

export const settlementFormSchema = z.object({
  area: z.enum(PLAGA_VALUES, 'יש לבחור פלגה'),
  council_id: z.string().trim().nullable(),
  coordinator_name: z.string().trim().optional(),
  coordinator_phone: z.string().trim().optional(),
  is_active: z.boolean(),
  name: z.string().trim().min(2, 'יש להזין שם יישוב'),
  total_squad_members: z
    .number()
    .int('יש להזין מספר שלם ללא שברים')
    .min(0, 'המספר לא יכול להיות שלילי')
    .nullable(),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
