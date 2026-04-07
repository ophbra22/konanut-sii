import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import { Alert, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import { AccountDeletionRequestCard } from '@/src/features/auth/components/account-deletion-request-card';
import { PendingUserApprovalCard } from '@/src/features/auth/components/pending-user-approval-card';
import {
  canManageUserApprovals,
} from '@/src/features/auth/lib/permissions';
import { useDeletionRequestedUsersQuery } from '@/src/features/auth/hooks/use-deletion-requested-users-query';
import { usePendingUsersQuery } from '@/src/features/auth/hooks/use-pending-users-query';
import {
  useApprovePendingUserMutation,
  useDeleteRequestedUserMutation,
  useRejectPendingUserMutation,
} from '@/src/features/auth/hooks/use-user-approval-mutations';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { PLAGA_VALUES } from '@/src/lib/plaga';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, type AppTheme } from '@/src/theme';

export default function UsersApprovalScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = canManageUserApprovals(role);
  const pendingUsersQuery = usePendingUsersQuery(canManage);
  const deletionRequestsQuery = useDeletionRequestedUsersQuery(canManage);
  const settlementsQuery = useSettlementsQuery(canManage);
  const approveMutation = useApprovePendingUserMutation();
  const deleteRequestedUserMutation = useDeleteRequestedUserMutation();
  const rejectMutation = useRejectPendingUserMutation();

  useFocusEffect(
    useCallback(() => {
      if (!canManage) {
        return undefined;
      }

      void pendingUsersQuery.refetch();
      void deletionRequestsQuery.refetch();

      return undefined;
    }, [canManage, deletionRequestsQuery, pendingUsersQuery])
  );

  const settlementOptions = (settlementsQuery.data ?? [])
    .filter((settlement) => settlement.is_active)
    .map((settlement) => ({
      area: settlement.area,
      id: settlement.id,
      name: settlement.name,
      regional_council: settlement.regional_council,
    }));
  const regionalCouncilOptions = Array.from(
    new Set(
      settlementOptions
        .map((settlement) => settlement.regional_council?.trim())
        .filter((regionalCouncil): regionalCouncil is string => Boolean(regionalCouncil))
    )
  ).sort((left, right) => left.localeCompare(right, 'he'));

  if (!canManage) {
    return (
      <AppScreen>
        <OpsListHeader
          actions={
            <OpsIconButton
              accessibilityLabel="חזרה לפרופיל"
              icon={ArrowRight}
              onPress={() => {
                router.replace('/profile' as never);
              }}
            />
          }
          subtitle="גישה מוגבלת למנהל־על בלבד"
          title="אישור משתמשים"
        />

        <StateCard
          actionLabel="חזרה לפרופיל"
          description="המסך הזה זמין רק למשתמשי מנהל־על."
          onAction={() => {
            router.replace('/profile' as never);
          }}
          title="אין הרשאה לצפייה במסך"
          variant="warning"
        />
      </AppScreen>
    );
  }

  if (
    pendingUsersQuery.isLoading ||
    deletionRequestsQuery.isLoading ||
    settlementsQuery.isLoading
  ) {
    return <AppLoader label="טוען משתמשים לאישור..." />;
  }

  const pendingUsers = pendingUsersQuery.data ?? [];
  const deletionRequests = deletionRequestsQuery.data ?? [];
  const approvingUserId = approveMutation.isPending ? approveMutation.variables?.userId : null;
  const deletingUserId = deleteRequestedUserMutation.isPending
    ? deleteRequestedUserMutation.variables
    : null;
  const rejectingUserId = rejectMutation.isPending ? rejectMutation.variables : null;
  const openRequestsCount = pendingUsers.length + deletionRequests.length;

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <KeyboardSafeScrollView
        contentContainerStyle={styles.content}
      >
        <OpsListHeader
          actions={
            <OpsIconButton
              accessibilityLabel="חזרה לפרופיל"
              icon={ArrowRight}
              onPress={() => {
                router.back();
              }}
            />
          }
          subtitle={`${openRequestsCount} בקשות פתוחות לטיפול`}
          title="אישור משתמשים"
        />

        {pendingUsersQuery.error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={pendingUsersQuery.error.message}
            onAction={() => {
              void pendingUsersQuery.refetch();
            }}
            title="לא ניתן לטעון את רשימת המשתמשים"
            variant="warning"
          />
        ) : null}

        {deletionRequestsQuery.error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={deletionRequestsQuery.error.message}
            onAction={() => {
              void deletionRequestsQuery.refetch();
            }}
            title="לא ניתן לטעון את בקשות מחיקת החשבון"
            variant="warning"
          />
        ) : null}

        {settlementsQuery.error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={settlementsQuery.error.message}
            onAction={() => {
              void settlementsQuery.refetch();
            }}
            title="לא ניתן לטעון את רשימת היישובים"
            variant="warning"
          />
        ) : null}

        {!pendingUsersQuery.error &&
        !deletionRequestsQuery.error &&
        !settlementsQuery.error &&
        openRequestsCount === 0 ? (
          <StateCard
            actionLabel="רענון"
            description="אין כרגע בקשות פתוחות לאישור משתמשים או למחיקת חשבון."
            onAction={() => {
              void Promise.all([
                pendingUsersQuery.refetch(),
                deletionRequestsQuery.refetch(),
              ]);
            }}
            title="אין בקשות פתוחות"
          />
        ) : null}

        {!pendingUsersQuery.error && !settlementsQuery.error && pendingUsers.length ? (
          <AppRevealView delay={40}>
            <SectionBlock
              description="משתמשים חדשים שממתינים להפעלה ולהקצאת הרשאות."
              title="בקשות הצטרפות"
            >
              <View style={styles.list}>
                {pendingUsers.map((user) => (
                  <PendingUserApprovalCard
                    key={user.id}
                    isApproving={approvingUserId === user.id}
                    isRejecting={rejectingUserId === user.id}
                    onApprove={({
                      assignedPlaga,
                      regionalCouncils,
                      role: selectedRole,
                      settlementIds,
                    }) => {
                      approveMutation.mutate({
                        assignedPlaga,
                        regionalCouncils,
                        role: selectedRole,
                        settlementIds,
                        userId: user.id,
                      });
                    }}
                    onReject={() => {
                      Alert.alert(
                        'דחיית משתמש',
                        `האם להשאיר את ${user.full_name} במצב לא פעיל?`,
                        [
                          { style: 'cancel', text: 'ביטול' },
                          {
                            style: 'destructive',
                            text: 'דחייה',
                            onPress: () => {
                              rejectMutation.mutate(user.id);
                            },
                          },
                        ]
                      );
                    }}
                    plagaOptions={PLAGA_VALUES}
                    regionalCouncilOptions={regionalCouncilOptions}
                    settlementOptions={settlementOptions}
                    user={user}
                  />
                ))}
              </View>
            </SectionBlock>
          </AppRevealView>
        ) : null}

        {!deletionRequestsQuery.error && deletionRequests.length ? (
          <AppRevealView delay={80}>
            <SectionBlock
              description="משתמשים שביקשו לסגור את החשבון וממתינים לטיפול מנהלי."
              title="בקשות מחיקת חשבון"
            >
              <View style={styles.list}>
                {deletionRequests.map((user) => (
                  <AccountDeletionRequestCard
                    key={user.id}
                    isDeleting={deletingUserId === user.id}
                    onDelete={() => {
                      Alert.alert(
                        'מחיקת משתמש',
                        `האם למחוק כעת את ${user.full_name} לצמיתות? הפעולה תסיר גם את חשבון ההתחברות ולא ניתן יהיה לשחזר אותה.`,
                        [
                          { style: 'cancel', text: 'ביטול' },
                          {
                            style: 'destructive',
                            text: 'מחיקה',
                            onPress: () => {
                              deleteRequestedUserMutation.mutate(user.id);
                            },
                          },
                        ]
                      );
                    }}
                    user={user}
                  />
                ))}
              </View>
            </SectionBlock>
          </AppRevealView>
        ) : null}
      </KeyboardSafeScrollView>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  content: {
    gap: theme.spacing.section,
    paddingBottom: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.sm,
  },
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.xxs,
  },
}));
