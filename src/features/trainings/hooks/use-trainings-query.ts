import { useQuery } from '@tanstack/react-query';

import { listTrainings } from '@/src/features/trainings/api/trainings-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useTrainingsQuery() {
  return useQuery({
    queryFn: listTrainings,
    queryKey: queryKeys.trainings.all,
  });
}
