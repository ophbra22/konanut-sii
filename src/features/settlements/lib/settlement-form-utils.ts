import type { SettlementFormValues } from '@/src/features/settlements/schemas/settlement-form-schema';
import { PLAGA_VALUES } from '@/src/lib/plaga';
import type { Settlement, TablesInsert, TablesUpdate } from '@/src/types/database';

function toOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getSettlementFormValues(
  settlement?: Partial<Settlement>
): SettlementFormValues {
  return {
    area: (settlement?.area as SettlementFormValues['area'] | undefined) ?? PLAGA_VALUES[0],
    coordinator_name: settlement?.coordinator_name ?? '',
    coordinator_phone: settlement?.coordinator_phone ?? '',
    is_active: settlement?.is_active ?? true,
    name: settlement?.name ?? '',
    regional_council: settlement?.regional_council ?? '',
  };
}

export function toSettlementInsertInput(
  values: SettlementFormValues
): TablesInsert<'settlements'> {
  return {
    area: values.area.trim(),
    coordinator_name: toOptionalText(values.coordinator_name),
    coordinator_phone: toOptionalText(values.coordinator_phone),
    is_active: values.is_active,
    name: values.name.trim(),
    regional_council: toOptionalText(values.regional_council),
  };
}

export function toSettlementUpdateInput(
  values: SettlementFormValues
): TablesUpdate<'settlements'> {
  return toSettlementInsertInput(values);
}
