import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type { Settlement, SettlementRanking } from '@/src/types/database';

export type SettlementListItem = Settlement;

export type SettlementDetails = Settlement & {
  rankings: SettlementRanking[];
};

export async function listSettlements(): Promise<SettlementListItem[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את רשימת היישובים');
  }

  return data ?? [];
}

export async function getSettlementDetails(
  settlementId: string
): Promise<SettlementDetails> {
  const [{ data: settlement, error: settlementError }, { data: rankings, error: rankingsError }] =
    await Promise.all([
      supabase
        .from('settlements')
        .select('*')
        .eq('id', settlementId)
        .maybeSingle(),
      supabase
        .from('settlement_rankings')
        .select('*')
        .eq('settlement_id', settlementId)
        .order('calculated_at', { ascending: false }),
    ]);

  if (settlementError) {
    throw createDataAccessError(settlementError, 'לא ניתן לטעון את פרטי היישוב');
  }

  if (rankingsError) {
    throw createDataAccessError(rankingsError, 'לא ניתן לטעון את דירוגי היישוב');
  }

  if (!settlement) {
    throw new Error('היישוב המבוקש לא נמצא');
  }

  return {
    ...settlement,
    rankings: rankings ?? [],
  };
}
