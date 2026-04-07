import { useQuery } from '@tanstack/react-query';

import { listPendingUsers } from '@/src/features/auth/api/user-approval-service';
import { queryKeys } from '@/src/lib/query-keys';

export function usePendingUsersQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listPendingUsers,
    queryKey: queryKeys.auth.pendingUsers,
    refetchOnMount: 'always',
  });
}
