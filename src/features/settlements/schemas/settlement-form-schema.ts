import { z } from 'zod';

export const settlementFormSchema = z.object({
  area: z.string().min(1, 'יש להזין אזור'),
  coordinator_name: z.string().trim().optional(),
  coordinator_phone: z.string().trim().optional(),
  is_active: z.boolean(),
  name: z.string().trim().min(2, 'יש להזין שם יישוב'),
  regional_council: z.string().trim().optional(),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
