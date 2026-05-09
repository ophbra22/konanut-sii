import { useQuery } from '@tanstack/react-query';

import { getHomeNotificationsForCurrentUser } from '@/src/services/notificationsService';
import { queryKeys } from '@/src/lib/query-keys';
import { useAuthStore } from '@/src/stores/auth-store';

export function useHomeNotificationsQuery() {
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);

  return useQuery({
    enabled: Boolean(profile?.id && role),
    queryFn: getHomeNotificationsForCurrentUser,
    queryKey: [
      ...queryKeys.notifications.home,
      profile?.id ?? 'no-user',
      role ?? 'no-role',
      profile?.approval_status ?? 'no-status',
      profile?.assigned_plaga ?? 'no-plaga',
      (profile?.linkedRegionalCouncils ?? []).join('|'),
      (profile?.linkedSettlementIds ?? []).join('|'),
    ],
  });
}
