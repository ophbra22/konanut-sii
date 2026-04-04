import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { SectionBlock } from '@/src/components/ui/section-block';
import { getRoleLabel } from '@/src/features/auth/lib/permissions';
import { DashboardMetricCard } from '@/src/features/dashboard/components/dashboard-metric-card';
import { NextTrainingHeroCard } from '@/src/features/dashboard/components/next-training-hero-card';
import {
  type DashboardAlertItem,
  type DashboardOverview,
} from '@/src/features/dashboard/api/dashboard-service';
import { useDashboardQuery } from '@/src/features/dashboard/hooks/use-dashboard-query';
import { type ComplianceFilterKey } from '@/src/features/settlements/lib/compliance-filters';
import {
  formatDisplayDate,
  getHalfYearLabel,
} from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

function getAlertColor(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return theme.colors.danger;
    case 'medium':
      return theme.colors.warning;
    default:
      return theme.colors.accentStrong;
  }
}

function getAlertStatusLabel(status: 'open' | 'resolved') {
  return status === 'resolved' ? 'טופל' : 'ללא טיפול';
}

function DashboardAlertStatusPill({
  status,
}: {
  status: DashboardAlertItem['status'];
}) {
  const isResolved = status === 'resolved';

  return (
    <View
      style={[
        styles.alertStatusPill,
        isResolved ? styles.alertStatusPillResolved : styles.alertStatusPillOpen,
      ]}
    >
      <Text
        style={[
          styles.alertStatusText,
          isResolved ? styles.alertStatusTextResolved : styles.alertStatusTextOpen,
        ]}
      >
        {getAlertStatusLabel(status)}
      </Text>
    </View>
  );
}

function DashboardAlertPreviewItem({
  alertItem,
  isLast,
}: {
  alertItem: DashboardAlertItem;
  isLast: boolean;
}) {
  return (
    <View style={[styles.alertRow, !isLast ? styles.alertRowBorder : null]}>
      <View style={[styles.alertDot, { backgroundColor: getAlertColor(alertItem.severity) }]} />

      <View style={styles.alertContent}>
        <View style={styles.alertTitleRow}>
          <DashboardAlertStatusPill status={alertItem.status} />
          <Text numberOfLines={1} style={styles.alertTitle}>
            {alertItem.related_settlement_name
              ? `${alertItem.title} – ${alertItem.related_settlement_name}`
              : alertItem.title}
          </Text>
        </View>

        <Text numberOfLines={2} style={styles.alertSubtitle}>
          {formatDisplayDate(alertItem.created_at)} • {alertItem.type}
        </Text>
      </View>
    </View>
  );
}

function getSystemSupportLine(data: DashboardOverview | undefined) {
  if (!data) {
    return 'המערכת מסונכרנת ומוכנה לעבודה.';
  }

  if (data.averageSettlementScore !== null) {
    return `ממוצע כשירות ${data.averageSettlementScore} • ${getHalfYearLabel(data.currentRankingPeriod)}`;
  }

  return `מסונכרן ל-${getHalfYearLabel(data.currentRankingPeriod)}`;
}

function getGreetingLabel() {
  const hour = dayjs().hour();

  if (hour >= 18) {
    return 'ערב טוב';
  }

  if (hour >= 12) {
    return 'צהריים טובים';
  }

  if (hour >= 5) {
    return 'בוקר טוב';
  }

  return 'לילה טוב';
}

export default function DashboardScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const profile = useAuthStore((state) => state.profile);
  const { data, error, isLoading, refetch } = useDashboardQuery();
  const nextTraining = data?.upcomingTrainings[0] ?? null;
  const alerts = data?.alertsSummary.slice(0, 3) ?? [];
  const greetingName =
    profile?.full_name?.trim() || profile?.email?.trim() || getRoleLabel(role);
  const heroGreeting = `${getGreetingLabel()}, ${greetingName}`;
  const todayLabel = formatDisplayDate(dayjs().format('YYYY-MM-DD'));

  const navigateToComplianceFilter = (filter: ComplianceFilterKey) => {
    router.push(
      `/settlements?complianceFilter=${filter}&filterRequestAt=${Date.now()}` as never
    );
  };

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <AppRevealView delay={20}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>מרכז שליטה מבצעי</Text>
          <Text style={styles.heroTitle}>זרוע יישובים מג״ב דרום</Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroDate}>{todayLabel}</Text>
            <Text numberOfLines={1} style={styles.heroGreeting}>
              {heroGreeting}
            </Text>
          </View>
          <Text style={styles.heroSubtitle}>תמונת מצב אימונים בזמן אמת</Text>
        </View>
      </AppRevealView>

      <AppRevealView delay={40}>
        <View style={styles.metricsGrid}>
          <DashboardMetricCard
            errorMessage={error?.message}
            isEmpty={!isLoading && !error && (data?.weeklyTrainingsCount ?? 0) === 0}
            isLoading={isLoading}
            label="אימונים השבוע"
            style={styles.metricCard}
            tone="accent"
            value={String(data?.weeklyTrainingsCount ?? 0)}
          />
          <DashboardMetricCard
            errorMessage={error?.message}
            isEmpty={!isLoading && !error && (data?.monthlyTrainingsCount ?? 0) === 0}
            isLoading={isLoading}
            label="אימונים החודש"
            style={styles.metricCard}
            tone="accent"
            value={String(data?.monthlyTrainingsCount ?? 0)}
          />
          <DashboardMetricCard
            errorMessage={error?.message}
            emptyLabel="ללא חוסרים"
            isEmpty={!isLoading && !error && (data?.missingShootingSettlementsCount ?? 0) === 0}
            isLoading={isLoading}
            label="חסרי מטווח בחציון"
            onPress={
              !isLoading && !error
                ? () => {
                    navigateToComplianceFilter('shooting-missing');
                  }
                : undefined
            }
            style={styles.metricCard}
            tone="warning"
            value={String(data?.missingShootingSettlementsCount ?? 0)}
          />
          <DashboardMetricCard
            emptyLabel="ללא חוסרים"
            errorMessage={error?.message}
            isEmpty={!isLoading && !error && (data?.missingDefenseSettlementsCount ?? 0) === 0}
            isLoading={isLoading}
            label="חסרי הגנת יישוב"
            onPress={
              !isLoading && !error
                ? () => {
                    navigateToComplianceFilter('defense-missing');
                  }
                : undefined
            }
            style={styles.metricCard}
            tone="warning"
            value={String(data?.missingDefenseSettlementsCount ?? 0)}
          />
        </View>
      </AppRevealView>

      <AppRevealView delay={70}>
        {isLoading ? (
          <AppCard style={styles.featuredCard}>
            <View style={styles.featuredSkeleton}>
              <View style={[styles.featuredSkeletonLine, styles.featuredSkeletonTop]} />
              <View style={[styles.featuredSkeletonLine, styles.featuredSkeletonTitle]} />
              <View style={[styles.featuredSkeletonLine, styles.featuredSkeletonMeta]} />
              <View style={[styles.featuredSkeletonLine, styles.featuredSkeletonButton]} />
            </View>
          </AppCard>
        ) : error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={error.message}
            onAction={() => {
              void refetch();
            }}
            title="לא ניתן לטעון את האימון הבא"
            variant="warning"
          />
        ) : nextTraining ? (
          <NextTrainingHeroCard training={nextTraining} />
        ) : (
          <AppCard style={styles.featuredEmptyCard}>
            <Text style={styles.featuredEyebrow}>האימון הבא שלך</Text>
            <Text style={styles.emptyTitle}>אין אימון קרוב</Text>
            <Text style={styles.emptyDescription}>לוח האימונים פנוי כרגע.</Text>
          </AppCard>
        )}
      </AppRevealView>

      <AppRevealView delay={95}>
        {error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={error.message}
            onAction={() => {
              void refetch();
            }}
            title="לא ניתן להציג סטטוס מערכת"
            variant="warning"
          />
        ) : (
          <View style={styles.systemCard}>
            <View style={styles.systemTopRow}>
              <AppBadge label={data?.systemStatus ?? 'מבצעי'} size="sm" tone="accent" />
              <Text style={styles.systemTitle}>סטטוס מערכת</Text>
            </View>
            <Text style={styles.systemText}>{getSystemSupportLine(data)}</Text>
          </View>
        )}
      </AppRevealView>

      <AppRevealView delay={120}>
        <SectionBlock title="התראות">
          {isLoading ? (
            <View style={styles.alertsList}>
              <Text style={styles.alertsPlaceholder}>טוען את ההתראות האחרונות...</Text>
            </View>
          ) : error ? (
            <StateCard
              actionLabel="נסו שוב"
              description={error.message}
              onAction={() => {
                void refetch();
              }}
              title="לא ניתן לטעון התראות"
              variant="warning"
            />
          ) : alerts.length ? (
            <View style={styles.alertsList}>
              {alerts.map((alertItem, index) => (
                <DashboardAlertPreviewItem
                  key={alertItem.id}
                  alertItem={alertItem}
                  isLast={index === alerts.length - 1}
                />
              ))}

              <Pressable
                onPress={() => {
                  router.push('/alerts' as never);
                }}
                style={({ pressed }) => [
                  styles.alertsCta,
                  pressed && styles.alertsCtaPressed,
                ]}
              >
                <Text style={styles.alertsCtaText}>לכל ההתראות →</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.alertsList}>
              <Text style={styles.emptyTitle}>אין התראות חדשות</Text>
              <Text style={styles.emptyDescription}>לא זוהו חריגים להצגה כרגע.</Text>
            </View>
          )}
        </SectionBlock>
      </AppRevealView>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  alertContent: {
    flex: 1,
    gap: 6,
  },
  alertsCta: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 2,
  },
  alertsCtaPressed: {
    opacity: 0.82,
  },
  alertsCtaText: {
    color: theme.colors.info,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  alertDot: {
    borderRadius: 999,
    height: 7,
    marginTop: 7,
    width: 7,
  },
  alertRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: 12,
    minHeight: 54,
    paddingVertical: 12,
  },
  alertRowBorder: {
    borderBottomColor: theme.colors.separatorStrong,
    borderBottomWidth: 1,
  },
  alertStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertStatusPillOpen: {
    backgroundColor: theme.colors.statusOpenSurface,
  },
  alertStatusPillResolved: {
    backgroundColor: theme.colors.statusResolvedSurface,
  },
  alertStatusText: {
    ...theme.typography.badge,
    textAlign: 'center',
  },
  alertStatusTextOpen: {
    color: theme.colors.warning,
  },
  alertStatusTextResolved: {
    color: theme.colors.accentStrong,
  },
  alertSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'right',
  },
  alertTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'right',
  },
  alertTitleRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
  alertsList: {
    gap: 0,
  },
  alertsPlaceholder: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    paddingVertical: 8,
    textAlign: 'right',
  },
  emptyDescription: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },
  emptyTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  featuredCard: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.cardOutline,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  featuredEmptyCard: {
    borderRadius: 16,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  featuredEyebrow: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  featuredSkeleton: {
    gap: 10,
  },
  featuredSkeletonButton: {
    height: 38,
    width: '100%',
  },
  featuredSkeletonLine: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 12,
  },
  featuredSkeletonMeta: {
    height: 12,
    width: '74%',
  },
  featuredSkeletonTitle: {
    height: 22,
    width: '58%',
  },
  featuredSkeletonTop: {
    width: '22%',
  },
  hero: {
    gap: 8,
  },
  heroEyebrow: {
    ...theme.typography.eyebrow,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  heroDate: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'left',
  },
  heroGreeting: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
    fontWeight: '800',
    minWidth: 0,
    textAlign: 'right',
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
  heroSubtitle: {
    ...theme.typography.meta,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31,
    letterSpacing: -0.4,
    textAlign: 'right',
  },
  metricCard: {
    minWidth: 0,
    width: '48.4%',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  screenContent: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  systemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  systemText: {
    ...theme.typography.meta,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  systemTitle: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  systemTopRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
}));
