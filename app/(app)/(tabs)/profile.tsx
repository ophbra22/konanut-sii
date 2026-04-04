import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { DataRow } from '@/src/components/ui/data-row';
import { MetricCard } from '@/src/components/ui/metric-card';
import { PageHeader } from '@/src/components/ui/page-header';
import {
  canManageUserApprovals,
  getRoleLabel,
  isCouncilScopedRole,
  isSettlementScopedRole,
} from '@/src/features/auth/lib/permissions';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const canApproveUsers = canManageUserApprovals(role);
  const isCouncilScoped = isCouncilScopedRole(role);
  const showSettlementAssignments =
    Boolean(profile?.linkedSettlements.length) || isSettlementScopedRole(role);
  const showRegionalCouncilAssignments =
    Boolean(profile?.linkedRegionalCouncils.length) || isCouncilScoped;

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <PageHeader
        eyebrow="פרופיל"
        title="חשבון משתמש"
        subtitle="פרטי חשבון, הרשאה ופעולות מערכת"
      />

      {!profile ? (
        <StateCard
          description="לא הצלחנו לטעון את פרטי המשתמש המחובר."
          title="פרופיל לא זמין"
          variant="warning"
        />
      ) : (
        <>
          <AppRevealView delay={30}>
            <View style={styles.metricsGrid}>
              <MetricCard label="סטטוס" style={styles.metricCard} tone="accent" value="מחובר" />
              <MetricCard label="תפקיד" style={styles.metricCard} value={getRoleLabel(role)} />
              <MetricCard
                label={isCouncilScoped ? 'מועצות מקושרות' : 'יישובים מקושרים'}
                style={styles.metricCard}
                tone={
                  (isCouncilScoped
                    ? profile.linkedRegionalCouncils.length
                    : profile.linkedSettlementIds.length)
                    ? 'accent'
                    : 'warning'
                }
                value={String(
                  isCouncilScoped
                    ? profile.linkedRegionalCouncils.length
                    : profile.linkedSettlementIds.length
                )}
              />
            </View>
          </AppRevealView>

          <AppRevealView delay={60}>
            <AppCard style={styles.identityCard}>
              <View style={styles.identityHeader}>
                <Text numberOfLines={2} style={styles.identityName}>
                  {profile.full_name}
                </Text>
                <View style={styles.badges}>
                  <AppBadge label={getRoleLabel(role)} size="sm" tone="info" />
                  <AppBadge label={profile.is_active ? 'פעיל' : 'לא פעיל'} size="sm" tone="neutral" />
                </View>
              </View>

              <View style={styles.badges}>
                {profile.requested_role ? (
                  <AppBadge label={`בקשה: ${getRoleLabel(profile.requested_role)}`} size="sm" tone="warning" />
                ) : null}
              </View>

              <View style={styles.identityDetails}>
                <DataRow label="דוא״ל" value={profile.email?.trim() || 'לא הוגדר'} />
                <DataRow label="טלפון" value={profile.phone?.trim() || 'לא הוגדר'} />
              </View>

              {showRegionalCouncilAssignments ? (
                <View style={styles.assignmentSection}>
                  <Text style={styles.assignmentLabel}>מועצות משויכות</Text>

                  {profile.linkedRegionalCouncils.length ? (
                    <View style={styles.badges}>
                      {profile.linkedRegionalCouncils.map((regionalCouncil) => (
                        <AppBadge
                          key={regionalCouncil}
                          label={regionalCouncil}
                          size="sm"
                          tone="info"
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.assignmentEmpty}>
                      עדיין לא הוגדרו מועצות משויכות לחשבון הזה.
                    </Text>
                  )}
                </View>
              ) : null}

              {showSettlementAssignments ? (
                <View style={styles.assignmentSection}>
                  <Text style={styles.assignmentLabel}>יישובים משויכים</Text>

                  {profile.linkedSettlements.length ? (
                    <View style={styles.badges}>
                      {profile.linkedSettlements.map((settlement) => (
                        <AppBadge
                          key={settlement.id}
                          label={settlement.name}
                          size="sm"
                          tone="info"
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.assignmentEmpty}>
                      עדיין לא הוגדרו יישובים משויכים לחשבון הזה.
                    </Text>
                  )}
                </View>
              ) : null}
            </AppCard>
          </AppRevealView>

          <AppRevealView delay={90}>
            <AppCard style={styles.actionsCard} title="פעולות">
              {canApproveUsers ? (
                <View style={styles.adminActions}>
                  <AppButton
                    label="אישור משתמשים"
                    onPress={() => {
                      router.push('/admin/users-approval' as never);
                    }}
                    size="sm"
                    variant="primary"
                  />
                  <AppButton
                    label="ניהול משתמשים"
                    onPress={() => {
                      router.push('/admin/users-management' as never);
                    }}
                    size="sm"
                    variant="secondary"
                  />
                </View>
              ) : null}

              <View style={styles.actions}>
                <AppButton
                  fullWidth={false}
                  label="רענון פרופיל"
                  onPress={() => {
                    void refreshProfile();
                  }}
                  size="sm"
                  style={styles.actionButton}
                  variant="secondary"
                />
                <AppButton
                  fullWidth={false}
                  label="יציאה מהמערכת"
                  onPress={() => {
                    void signOut();
                  }}
                  size="sm"
                  style={styles.actionButton}
                  variant="danger"
                />
              </View>
            </AppCard>
          </AppRevealView>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  adminActions: {
    gap: theme.spacing.xs,
  },
  actionsCard: {
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  assignmentEmpty: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  assignmentLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  assignmentSection: {
    gap: theme.spacing.xs,
  },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  identityCard: {
    gap: theme.spacing.xs,
  },
  identityDetails: {
    gap: theme.spacing.xs,
  },
  identityHeader: {
    gap: 5,
  },
  identityName: {
    ...theme.typography.screenTitle,
    color: theme.colors.textPrimary,
    fontSize: 22,
    lineHeight: 25,
    textAlign: 'right',
  },
  metricCard: {
    minWidth: 0,
    width: '31.7%',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  screenContent: {
    gap: 10,
  },
});
