import { useMutation } from '@tanstack/react-query';

import {
  createProfessionalContent,
  deleteProfessionalContent,
  updateProfessionalContent,
} from '@/src/features/professional-content/api/professional-content-service';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type { TablesInsert, TablesUpdate } from '@/src/types/database';

function invalidateProfessionalContentQueries(contentId?: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.professionalContent.all });

  if (contentId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.professionalContent.detail(contentId),
    });
  }
}

export function useCreateProfessionalContentMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (values: TablesInsert<'professional_content'>) =>
      createProfessionalContent(values),
    onSuccess: () => {
      invalidateProfessionalContentQueries();
      showToast('פריט התוכן נוצר בהצלחה', 'success');
    },
  });
}

export function useUpdateProfessionalContentMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      contentId,
      values,
    }: {
      contentId: string;
      values: TablesUpdate<'professional_content'>;
    }) => updateProfessionalContent(contentId, values),
    onSuccess: (_, variables) => {
      invalidateProfessionalContentQueries(variables.contentId);
      showToast('פריט התוכן עודכן', 'success');
    },
  });
}

export function useDeleteProfessionalContentMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (contentId: string) => deleteProfessionalContent(contentId),
    onSuccess: () => {
      invalidateProfessionalContentQueries();
      showToast('פריט התוכן נמחק', 'success');
    },
  });
}
