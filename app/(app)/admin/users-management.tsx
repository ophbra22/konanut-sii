import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { ManagedUserAccessCard } from '@/src/features/auth/components/managed-user-access-card';
import { canManageUserApprovals } from '@/src/features/auth/lib/permissions';
import { useManagedUsersQuery } from '@/src/features/auth/hooks/use-managed-users-query';
import { useUpdateManagedUserAccessMutation } from '@/src/features/auth/hooks/use-user-approval-mutations';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { PLAGA_VALUES } from '@/src/lib/plaga';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

export default function UsersManagementScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = canManageUserApprovals(role);
  const managedUsersQuery = useManagedUsersQuery(canManage);
  const settlementsQuery = useSettlementsQuery(canManage);
  const updateMutation = useUpdateManagedUserAccessMutation();

  const settlementOptions = useMemo(
    () =>
      (settlementsQuery.data ?? [])
        .filter((settlement) => settlement.is_active)
        .map((settlement) => ({
          area: settlement.area,
          id: settlement.id,
          name: settlement.name,
          regional_council: settlement.regional_council,
        })),
    [settlementsQuery.data]
  );
  const regionalCouncilOptions = useMemo(
    () =>
      Array.from(
        new Set(
          settlementOptions
            .map((settlement) => settlement.regional_council?.trim())
            .filter((regionalCouncil): regionalCouncil is string => Boolean(regionalCouncil))
        )
      ).sort((left, right) => left.localeCompare(right, 'he')),
    [settlementOptions]
  );

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
          title="ניהול משתמשים"
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

  if (managedUsersQuery.isLoading || settlementsQuery.isLoading) {
    return <AppLoader label="טוען משתמשים והרשאות..." />;
  }

  const managedUsers = managedUsersQuery.data ?? [];
  const savingUserId = updateMutation.isPending ? updateMutation.variables?.userId : null;

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
          subtitle={`${managedUsers.length} משתמשים פעילים`}
          title="ניהול משתמשים"
        />

        {managedUsersQuery.error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={managedUsersQuery.error.message}
            onAction={() => {
              void managedUsersQuery.refetch();
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

        {!managedUsersQuery.error && !settlementsQuery.error && !managedUsers.length ? (
          <StateCard
            actionLabel="רענון"
            description="אין כרגע משתמשים פעילים לניהול."
            onAction={() => {
              void managedUsersQuery.refetch();
            }}
            title="אין משתמשים להצגה"
          />
        ) : null}

        {!managedUsersQuery.error && !settlementsQuery.error && managedUsers.length ? (
          <AppRevealView delay={40}>
            <View style={styles.list}>
              {managedUsers.map((user) => (
                <ManagedUserAccessCard
                  key={user.id}
                  isSaving={savingUserId === user.id}
                  onSave={({
                    assignedPlaga,
                    regionalCouncils,
                    role: selectedRole,
                    settlementIds,
                  }) => {
                    void updateMutation.mutateAsync({
                      assignedPlaga,
                      regionalCouncils,
                      role: selectedRole,
                      settlementIds,
                      userId: user.id,
                    });
                  }}
                  plagaOptions={PLAGA_VALUES}
                  regionalCouncilOptions={regionalCouncilOptions}
                  settlementOptions={settlementOptions}
                  user={user}
                />
              ))}
            </View>
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
