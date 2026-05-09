import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/src/lib/query-keys';
import {
  listAvailableRankingPeriods,
  listSettlementRankings,
} from '@/src/features/rankings/api/rankings-service';
import {
  getCurrentRankingPeriod,
  type RankingPeriod,
} from '@/src/features/rankings/utils/ranking-calculator';

export function useRankingsQuery(period: RankingPeriod = getCurrentRankingPeriod()) {
  return useQuery({
    queryFn: () => listSettlementRankings(period),
    queryKey: queryKeys.rankings.period(period),
  });
}

export function useRankingPeriodsQuery() {
  return useQuery({
    queryFn: listAvailableRankingPeriods,
    queryKey: queryKeys.rankings.periods,
  });
}
