import { useQuery } from '@tanstack/react-query';

import {
  getProfessionalContentDetails,
  listProfessionalContent,
} from '@/src/features/professional-content/api/professional-content-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useProfessionalContentQuery(includeInactive = false) {
  return useQuery({
    queryFn: () => listProfessionalContent({ includeInactive }),
    queryKey: queryKeys.professionalContent.list(includeInactive ? 'all' : 'active'),
  });
}

export function useProfessionalContentDetailsQuery(
  contentId?: string,
  includeInactive = false
) {
  return useQuery({
    enabled: Boolean(contentId),
    queryFn: () => getProfessionalContentDetails(contentId!, { includeInactive }),
    queryKey: contentId
      ? queryKeys.professionalContent.detail(contentId)
      : [...queryKeys.professionalContent.all, 'detail', 'missing'],
  });
}
