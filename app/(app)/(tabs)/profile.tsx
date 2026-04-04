import { MoonStar, SunMedium } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { DataRow } from '@/src/components/ui/data-row';
import { PageHeader } from '@/src/components/ui/page-header';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { SectionBlock } from '@/src/components/ui/section-block';
import {
  canManageUserApprovals,
  getRoleDescription,
  getRoleLabel,
  getRoleShortLabel,
  isCouncilScopedRole,
  isPlagaScopedRole,
  isSettlementScopedRole,
} from '@/src/features/auth/lib/permissions';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, useThemeController, type AppTheme } from '@/src/theme';

type ProfileStatTone = 'accent' | 'info' | 'warning';
const THEME_OPTIONS = [
  {
    label: 'כהה',
    value: 'dark',
  },
  {
    label: 'בהיר',
    value: 'light',
  },
] as const;

function ProfileStatTile({
  label,
  tone,
  value,
}: {
  label: string;
  tone: ProfileStatTone;
  value: string;
}) {
  return (
    <View style={[styles.statTile, statToneStyles[tone]]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { mode, setMode } = useThemeController();
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const canApproveUsers = canManageUserApprovals(role);
  const isPlagaScoped = isPlagaScopedRole(role);
  const isCouncilScoped = isCouncilScopedRole(role);
  const linkedScopeCount = isPlagaScoped
    ? profile?.assigned_plaga
      ? 1
      : 0
    : isCouncilScoped
      ? profile?.linkedRegionalCouncils.length ?? 0
      : profile?.linkedSettlementIds.length ?? 0;
  const showSettlementAssignments =
    Boolean(profile?.linkedSettlements.length) || isSettlementScopedRole(role);
  const showRegionalCouncilAssignments =
    Boolean(profile?.linkedRegionalCouncils.length) || isCouncilScoped;
  const showPlagaAssignment = Boolean(profile?.assigned_plaga) || isPlagaScoped;
  const primaryAction = canApproveUsers
    ? {
        label: 'אישור משתמשים',
        onPress: () => {
          router.push('/admin/users-approval' as never);
        },
      }
    : {
        label: 'רענון פרופיל',
        onPress: () => {
          void refreshProfile();
        },
      };

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
            <View style={styles.metricsRow}>
              <ProfileStatTile label="סטטוס" tone="accent" value="מחובר" />
              <ProfileStatTile label="תפקיד" tone="info" value={getRoleShortLabel(role)} />
              <ProfileStatTile
                label={isPlagaScoped ? 'פלגה' : isCouncilScoped ? 'מועצות' : 'יישובים'}
                tone={linkedScopeCount ? 'accent' : 'warning'}
                value={
                  isPlagaScoped
                    ? profile?.assigned_plaga?.trim() || 'לא הוגדר'
                    : String(linkedScopeCount)
                }
              />
            </View>
          </AppRevealView>

          <AppRevealView delay={60}>
            <AppCard style={styles.identityCard}>
              <View style={styles.identityTop}>
                <Text style={styles.identityEyebrow}>זהות והרשאה</Text>
                <Text numberOfLines={2} style={styles.identityName}>
                  {profile.full_name}
                </Text>
                <Text style={styles.identitySubtitle}>{getRoleDescription(role)}</Text>
              </View>

              <View style={styles.badgesRow}>
                <AppBadge label={getRoleLabel(role)} size="sm" tone="info" />
                <AppBadge
                  label={profile.is_active ? 'פעיל' : 'ממתין לאישור'}
                  size="sm"
                  tone={profile.is_active ? 'success' : 'warning'}
                />
                {profile.assigned_plaga ? (
                  <AppBadge label={`פלגה: ${profile.assigned_plaga}`} size="sm" tone="neutral" />
                ) : null}
                {profile.requested_role ? (
                  <AppBadge
                    label={`בקשה: ${getRoleLabel(profile.requested_role)}`}
                    size="sm"
                    tone="neutral"
                  />
                ) : null}
              </View>

              <View style={styles.identityDetails}>
                <DataRow label="דוא״ל" value={profile.email?.trim() || 'לא הוגדר'} />
                <DataRow label="טלפון" value={profile.phone?.trim() || 'לא הוגדר'} />
                {profile.assigned_plaga ? (
                  <DataRow label="פלגה" value={profile.assigned_plaga} />
                ) : null}
              </View>

              {showPlagaAssignment ? (
                <View style={styles.assignmentSection}>
                  <Text style={styles.assignmentLabel}>פלגה משויכת</Text>

                  {profile.assigned_plaga ? (
                    <View style={styles.badgesRow}>
                      <AppBadge label={profile.assigned_plaga} size="sm" tone="info" />
                    </View>
                  ) : (
                    <Text style={styles.assignmentEmpty}>
                      עדיין לא הוגדרה פלגה משויכת לחשבון הזה.
                    </Text>
                  )}
                </View>
              ) : null}

              {showRegionalCouncilAssignments ? (
                <View style={styles.assignmentSection}>
                  <Text style={styles.assignmentLabel}>מועצות משויכות</Text>

                  {profile.linkedRegionalCouncils.length ? (
                    <View style={styles.badgesRow}>
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
                    <View style={styles.badgesRow}>
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
            <SectionBlock
              description="הבחירה תחול על כל המערכת ותישמר למכשיר הזה"
              title="ערכת נושא"
            >
              <SegmentedControl
                onValueChange={setMode}
                options={[
                  {
                    icon: (
                      <MoonStar
                        color={mode === 'dark' ? theme.colors.textPrimary : theme.colors.textMuted}
                        size={14}
                        strokeWidth={2.1}
                      />
                    ),
                    label: THEME_OPTIONS[0].label,
                    value: THEME_OPTIONS[0].value,
                  },
                  {
                    icon: (
                      <SunMedium
                        color={mode === 'light' ? theme.colors.textPrimary : theme.colors.textMuted}
                        size={14}
                        strokeWidth={2.1}
                      />
                    ),
                    label: THEME_OPTIONS[1].label,
                    value: THEME_OPTIONS[1].value,
                  },
                ]}
                value={mode}
              />
            </SectionBlock>
          </AppRevealView>

          <AppRevealView delay={110}>
            <SectionBlock
              description="פעולות מהירות לחשבון ולהרשאות"
              title="פעולות חשבון"
            >
              <View style={styles.actionsStack}>
                <AppButton
                  label={primaryAction.label}
                  onPress={primaryAction.onPress}
                  size="sm"
                  style={styles.primaryActionButton}
                  variant="primary"
                />

                {canApproveUsers ? (
                  <>
                    <AppButton
                      label="ניהול משתמשים"
                      onPress={() => {
                        router.push('/admin/users-management' as never);
                      }}
                      size="sm"
                      style={styles.secondaryActionButton}
                      variant="secondary"
                    />
                    <AppButton
                      label="רענון פרופיל"
                      onPress={() => {
                        void refreshProfile();
                      }}
                      size="sm"
                      style={styles.secondaryActionButton}
                      variant="secondary"
                    />
                  </>
                ) : null}
              </View>

              <View style={styles.logoutSection}>
                <AppButton
                  label="יציאה מהמערכת"
                  onPress={() => {
                    void signOut();
                  }}
                  size="sm"
                  style={styles.logoutButton}
                  variant="danger"
                />
              </View>
            </SectionBlock>
          </AppRevealView>
        </>
      )}
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  assignmentEmpty: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    lineHeight: 18,
    textAlign: 'right',
  },
  assignmentLabel: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  assignmentSection: {
    borderTopColor: theme.colors.separator,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
    paddingTop: theme.spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  identityCard: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.cardOutlineStrong,
    borderRadius: 16,
    gap: theme.spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  identityDetails: {
    gap: 10,
  },
  identityEyebrow: {
    ...theme.typography.eyebrow,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  identityName: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 28,
    textAlign: 'right',
  },
  identitySubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    lineHeight: 18,
    textAlign: 'right',
  },
  identityTop: {
    gap: 6,
  },
  logoutButton: {
    borderRadius: 14,
  },
  logoutSection: {
    borderTopColor: theme.colors.separator,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
  metricsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
  primaryActionButton: {
    borderRadius: 14,
    minHeight: 42,
  },
  screenContent: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  secondaryActionButton: {
    borderColor: theme.colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 40,
  },
  statLabel: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  statTile: {
    borderRadius: 14,
    flex: 1,
    gap: 8,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'right',
  },
  actionsStack: {
    gap: 10,
  },
}));

const statToneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  info: {
    backgroundColor: theme.colors.surface,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
  },
}));
