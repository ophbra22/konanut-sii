import { useQuery } from '@tanstack/react-query';

import { listActiveProfiles } from '@/src/features/auth/api/profile-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useActiveProfilesQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listActiveProfiles,
    queryKey: queryKeys.auth.activeProfiles,
  });
}
