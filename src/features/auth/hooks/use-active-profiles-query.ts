import { useQuery } from '@tanstack/react-query';

import { listActiveProfiles } from '@/src/features/auth/api/profile-service';

export function useActiveProfilesQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listActiveProfiles,
    queryKey: ['users', 'active-profiles'],
  });
}
