import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { PendingUserApprovalCard } from '@/src/features/auth/components/pending-user-approval-card';
import {
  canManageUserApprovals,
} from '@/src/features/auth/lib/permissions';
import { usePendingUsersQuery } from '@/src/features/auth/hooks/use-pending-users-query';
import {
  useApprovePendingUserMutation,
  useRejectPendingUserMutation,
} from '@/src/features/auth/hooks/use-user-approval-mutations';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export default function UsersApprovalScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = canManageUserApprovals(role);
  const pendingUsersQuery = usePendingUsersQuery(canManage);
  const settlementsQuery = useSettlementsQuery(canManage);
  const approveMutation = useApprovePendingUserMutation();
  const rejectMutation = useRejectPendingUserMutation();

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

  if (pendingUsersQuery.isLoading || settlementsQuery.isLoading) {
    return <AppLoader label="טוען משתמשים לאישור..." />;
  }

  const pendingUsers = pendingUsersQuery.data ?? [];
  const approvingUserId = approveMutation.isPending ? approveMutation.variables?.userId : null;
  const rejectingUserId = rejectMutation.isPending ? rejectMutation.variables : null;

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
          subtitle={`${pendingUsers.length} משתמשים לא פעילים`}
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

        {!pendingUsersQuery.error && !settlementsQuery.error && !pendingUsers.length ? (
          <StateCard
            actionLabel="רענון"
            description="אין כרגע משתמשים לא פעילים שממתינים לטיפול."
            onAction={() => {
              void pendingUsersQuery.refetch();
            }}
            title="אין בקשות פתוחות"
          />
        ) : null}

        {!pendingUsersQuery.error && !settlementsQuery.error && pendingUsers.length ? (
          <AppRevealView delay={40}>
            <View style={styles.list}>
              {pendingUsers.map((user) => (
                <PendingUserApprovalCard
                  key={user.id}
                  isApproving={approvingUserId === user.id}
                  isRejecting={rejectingUserId === user.id}
                  onApprove={({ regionalCouncils, role: selectedRole, settlementIds }) => {
                    void approveMutation.mutateAsync({
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
                            void rejectMutation.mutateAsync(user.id);
                          },
                        },
                      ]
                    );
                  }}
                  regionalCouncilOptions={regionalCouncilOptions}
                  settlementOptions={settlementOptions}
                  user={user}
                />
              ))}
            </View>
          </AppRevealView>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
});
