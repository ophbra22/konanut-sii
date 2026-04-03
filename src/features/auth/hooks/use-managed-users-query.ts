import { useQuery } from '@tanstack/react-query';

import { listManagedUsers } from '@/src/features/auth/api/user-approval-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useManagedUsersQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listManagedUsers,
    queryKey: queryKeys.auth.managedUsers,
  });
}
