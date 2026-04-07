import { useQuery } from '@tanstack/react-query';

import { listDeletionRequestedUsers } from '@/src/features/auth/api/user-approval-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useDeletionRequestedUsersQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listDeletionRequestedUsers,
    queryKey: queryKeys.auth.deletionRequestedUsers,
    refetchOnMount: 'always',
  });
}
