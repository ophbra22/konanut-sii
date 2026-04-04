import { z } from 'zod';

import { PLAGA_VALUES } from '@/src/lib/plaga';

export const settlementFormSchema = z.object({
  area: z.enum(PLAGA_VALUES, 'יש לבחור פלגה'),
  coordinator_name: z.string().trim().optional(),
  coordinator_phone: z.string().trim().optional(),
  is_active: z.boolean(),
  name: z.string().trim().min(2, 'יש להזין שם יישוב'),
  regional_council: z.string().trim().optional(),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
