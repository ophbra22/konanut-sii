import type { SettlementFormValues } from '@/src/features/settlements/schemas/settlement-form-schema';
import { PLAGA_VALUES } from '@/src/lib/plaga';
import type { Council, Settlement, TablesInsert, TablesUpdate } from '@/src/types/database';

function toOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getSettlementFormValues(
  settlement?: Partial<Settlement>
): SettlementFormValues {
  return {
    area: (settlement?.area as SettlementFormValues['area'] | undefined) ?? PLAGA_VALUES[0],
    council_id: settlement?.council_id ?? null,
    coordinator_name: settlement?.coordinator_name ?? '',
    coordinator_phone: settlement?.coordinator_phone ?? '',
    is_active: settlement?.is_active ?? true,
    name: settlement?.name ?? '',
    total_squad_members: settlement?.total_squad_members ?? null,
  };
}

function getCouncilNameById(
  councilId: string | null,
  councilOptions: Pick<Council, 'id' | 'name'>[]
) {
  if (!councilId) {
    return null;
  }

  return councilOptions.find((council) => council.id === councilId)?.name?.trim() ?? null;
}

export function toSettlementInsertInput(
  values: SettlementFormValues,
  councilOptions: Pick<Council, 'id' | 'name'>[] = []
): TablesInsert<'settlements'> {
  return {
    area: values.area.trim(),
    council_id: values.council_id,
    coordinator_name: toOptionalText(values.coordinator_name),
    coordinator_phone: toOptionalText(values.coordinator_phone),
    is_active: values.is_active,
    name: values.name.trim(),
    regional_council: getCouncilNameById(values.council_id, councilOptions),
    total_squad_members: values.total_squad_members,
  };
}

export function toSettlementUpdateInput(
  values: SettlementFormValues,
  councilOptions: Pick<Council, 'id' | 'name'>[] = []
): TablesUpdate<'settlements'> {
  return toSettlementInsertInput(values, councilOptions);
}
