import { useQuery } from '@tanstack/react-query';

import {
  getTrainingDetails,
  listTrainings,
} from '@/src/features/trainings/api/trainings-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useTrainingsQuery() {
  return useQuery({
    queryFn: listTrainings,
    queryKey: queryKeys.trainings.all,
  });
}

export function useTrainingDetailsQuery(trainingId?: string) {
  return useQuery({
    enabled: Boolean(trainingId),
    queryFn: () => getTrainingDetails(trainingId as string),
    queryKey: queryKeys.trainings.detail(trainingId ?? 'missing'),
  });
}
