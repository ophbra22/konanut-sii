import { useMutation } from '@tanstack/react-query';

import { createCouncil, deleteCouncil } from '@/src/features/councils/api/councils-service';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type { TablesInsert } from '@/src/types/database';

function invalidateCouncilQueries() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.councils.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
}

export function useCreateCouncilMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (
      values: Pick<TablesInsert<'regional_councils'>, 'name' | 'plaga_name' | 'regional_squad_name'>
    ) => createCouncil(values),
    onSuccess: () => {
      invalidateCouncilQueries();
      showToast('המועצה נוספה בהצלחה', 'success');
    },
  });
}

export function useDeleteCouncilMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (councilId: string) => deleteCouncil(councilId),
    onSuccess: () => {
      invalidateCouncilQueries();
      showToast('המועצה הוסרה', 'success');
    },
  });
}
