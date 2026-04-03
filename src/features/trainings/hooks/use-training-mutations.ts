import { useMutation } from '@tanstack/react-query';

import {
  createTraining,
  deleteTraining,
  updateTraining,
  updateTrainingStatus,
} from '@/src/features/trainings/api/trainings-service';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type { TablesInsert, TablesUpdate, Training } from '@/src/types/database';

type TrainingMutationInput = {
  settlementIds: string[];
  values: TablesInsert<'trainings'>;
};

type TrainingUpdateMutationInput = {
  settlementIds: string[];
  trainingId: string;
  values: TablesUpdate<'trainings'>;
};

export function useCreateTrainingMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (params: TrainingMutationInput) => createTraining(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      showToast('האימון נוצר בהצלחה', 'success');
    },
  });
}

export function useUpdateTrainingMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (params: TrainingUpdateMutationInput) => updateTraining(params),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trainings.detail(variables.trainingId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      showToast('האימון עודכן בהצלחה', 'success');
    },
  });
}

export function useUpdateTrainingStatusMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      status,
      trainingId,
    }: {
      status: Training['status'];
      trainingId: string;
    }) => updateTrainingStatus(trainingId, status),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trainings.detail(variables.trainingId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      showToast('סטטוס האימון עודכן', 'success');
    },
  });
}

export function useDeleteTrainingMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (trainingId: string) => deleteTraining(trainingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      showToast('האימון נמחק', 'success');
    },
  });
}
