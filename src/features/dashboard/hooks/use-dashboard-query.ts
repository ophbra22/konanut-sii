import { useQuery } from '@tanstack/react-query';

import { getDashboardOverview } from '@/src/features/dashboard/api/dashboard-service';
import { queryKeys } from '@/src/lib/query-keys';
import { useAuthStore } from '@/src/stores/auth-store';

export function useDashboardQuery() {
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);

  return useQuery({
    enabled: Boolean(role),
    queryFn: () =>
      getDashboardOverview({
        linkedRegionalCouncils: profile?.linkedRegionalCouncils ?? [],
        linkedSettlementIds: profile?.linkedSettlementIds ?? [],
        role,
      }),
    queryKey: [
      ...queryKeys.dashboard.overview,
      role ?? 'no-role',
      (profile?.linkedRegionalCouncils ?? []).join('|'),
      (profile?.linkedSettlementIds ?? []).join('|'),
    ],
  });
}
