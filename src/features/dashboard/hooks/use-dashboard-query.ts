import { useQuery } from '@tanstack/react-query';

import { getDashboardOverview } from '@/src/features/dashboard/api/dashboard-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useDashboardQuery() {
  return useQuery({
    queryFn: getDashboardOverview,
    queryKey: queryKeys.dashboard.overview,
  });
}
