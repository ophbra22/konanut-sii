import { useMutation } from '@tanstack/react-query';

import {
  approvePendingUser,
  deleteRequestedUserAccount,
  rejectPendingUser,
  updateManagedUserAccess,
} from '@/src/features/auth/api/user-approval-service';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { useAuthStore } from '@/src/stores/auth-store';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type { UserRole } from '@/src/types/database';

export function useApprovePendingUserMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  return useMutation({
    mutationFn: ({
      assignedPlaga,
      regionalCouncils,
      role,
      settlementIds,
      userId,
    }: {
      assignedPlaga?: string | null;
      regionalCouncils?: string[];
      role: UserRole;
      settlementIds?: string[];
      userId: string;
    }) =>
      approvePendingUser({
        assignedPlaga,
        regionalCouncils,
        role,
        settlementIds,
        userId,
      }),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.pendingUsers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.activeProfiles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.managedUsers });
      await refreshProfile();
      showToast('המשתמש אושר בהצלחה', 'success');
    },
  });
}

export function useRejectPendingUserMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (userId: string) => rejectPendingUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.pendingUsers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.managedUsers });
      showToast('המשתמש נדחה ונשאר לא פעיל', 'info');
    },
  });
}

export function useDeleteRequestedUserMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (userId: string) => deleteRequestedUserAccount(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.deletionRequestedUsers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.pendingUsers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.activeProfiles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.managedUsers });
      showToast('המשתמש נמחק בהצלחה', 'success');
    },
    onError: (error: unknown) => {
      showToast(
        error instanceof Error ? error.message : 'לא ניתן למחוק את המשתמש כרגע',
        'error'
      );
    },
  });
}

export function useUpdateManagedUserAccessMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  return useMutation({
    mutationFn: ({
      assignedPlaga,
      regionalCouncils,
      role,
      settlementIds,
      userId,
    }: {
      assignedPlaga?: string | null;
      regionalCouncils?: string[];
      role: UserRole;
      settlementIds?: string[];
      userId: string;
    }) =>
      updateManagedUserAccess({
        assignedPlaga,
        regionalCouncils,
        role,
        settlementIds,
        userId,
      }),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.activeProfiles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.managedUsers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
      await refreshProfile();
      showToast('הרשאות המשתמש עודכנו בהצלחה', 'success');
    },
  });
}
