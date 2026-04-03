import { useMutation } from '@tanstack/react-query';

import {
  createSettlement,
  deleteSettlement,
  updateSettlement,
} from '@/src/features/settlements/api/settlements-service';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type { TablesInsert, TablesUpdate } from '@/src/types/database';

export function useCreateSettlementMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (values: TablesInsert<'settlements'>) => createSettlement(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      showToast('היישוב נוצר בהצלחה', 'success');
    },
  });
}

export function useUpdateSettlementMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      settlementId,
      values,
    }: {
      settlementId: string;
      values: TablesUpdate<'settlements'>;
    }) => updateSettlement(settlementId, values),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(variables.settlementId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      showToast('פרטי היישוב עודכנו', 'success');
    },
  });
}

export function useDeleteSettlementMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (settlementId: string) => deleteSettlement(settlementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      showToast('היישוב נמחק', 'success');
    },
  });
}
