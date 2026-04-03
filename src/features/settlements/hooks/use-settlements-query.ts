import { useQuery } from '@tanstack/react-query';

import {
  getSettlementDetails,
  listSettlements,
} from '@/src/features/settlements/api/settlements-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useSettlementsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listSettlements,
    queryKey: queryKeys.settlements.all,
  });
}

export function useSettlementDetailsQuery(settlementId?: string) {
  return useQuery({
    enabled: Boolean(settlementId),
    queryFn: () => getSettlementDetails(settlementId as string),
    queryKey: queryKeys.settlements.detail(settlementId ?? 'missing'),
  });
}
