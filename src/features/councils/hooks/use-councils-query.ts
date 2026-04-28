import { useQuery } from '@tanstack/react-query';

import { listCouncils } from '@/src/features/councils/api/councils-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useCouncilsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listCouncils,
    queryKey: queryKeys.councils.all,
  });
}
