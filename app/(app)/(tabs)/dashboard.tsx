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
  type DashboardOverview,
} from '@/src/features/dashboard/api/dashboard-service';
import { useDashboardQuery } from '@/src/features/dashboard/hooks/use-dashboard-query';
import {
  formatDisplayDate,
  getHalfYearLabel,
} from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

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

function getAlertSeverityLabel(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return 'דחוף';
    case 'medium':
      return 'במעקב';
    default:
      return 'מידע';
  }
}

function getAlertStatusLabel(status: 'open' | 'resolved') {
  return status === 'resolved' ? 'טופל' : 'ללא טיפול';
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
  const { data, error, isLoading, refetch } = useDashboardQuery();
  const nextTraining = data?.upcomingTrainings[0] ?? null;
  const alerts = data?.alertsSummary.slice(0, 3) ?? [];
  const heroGreeting = `${getGreetingLabel()}, ${getRoleLabel(role)}`;
  const todayLabel = formatDisplayDate(dayjs().format('YYYY-MM-DD'));

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <AppRevealView delay={20}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>זרוע יישובים מג״ב דרום</Text>
          <Text numberOfLines={1} style={styles.heroGreeting}>
            {heroGreeting}
          </Text>
          <Text style={styles.heroDate}>{todayLabel}</Text>
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
            tone="accent"
            value={String(data?.weeklyTrainingsCount ?? 0)}
          />
          <DashboardMetricCard
            errorMessage={error?.message}
            isEmpty={!isLoading && !error && (data?.monthlyTrainingsCount ?? 0) === 0}
            isLoading={isLoading}
            label="אימונים החודש"
            tone="accent"
            value={String(data?.monthlyTrainingsCount ?? 0)}
          />
          <DashboardMetricCard
            errorMessage={error?.message}
            isEmpty={!isLoading && !error && (data?.activeSettlementsCount ?? 0) === 0}
            isLoading={isLoading}
            label="יישובים פעילים"
            value={String(data?.activeSettlementsCount ?? 0)}
          />
          <DashboardMetricCard
            emptyLabel="ללא חוסרים"
            errorMessage={error?.message}
            isEmpty={!isLoading && !error && (data?.settlementsMissingFeedbackCount ?? 0) === 0}
            isLoading={isLoading}
            label="חוסרי משוב"
            tone="warning"
            value={String(data?.settlementsMissingFeedbackCount ?? 0)}
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
          <AppCard style={styles.systemCard}>
            <View style={styles.systemTopRow}>
              <AppBadge label={data?.systemStatus ?? 'מבצעי'} size="sm" tone="accent" />
              <Text style={styles.systemTitle}>סטטוס מערכת</Text>
            </View>
            <Text style={styles.systemText}>{getSystemSupportLine(data)}</Text>
          </AppCard>
        )}
      </AppRevealView>

      <AppRevealView delay={120}>
        <SectionBlock title="התראות">
          {isLoading ? (
            <AppCard style={styles.alertsCard}>
              <Text style={styles.alertsPlaceholder}>טוען את ההתראות האחרונות...</Text>
            </AppCard>
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
            <AppCard style={styles.alertsCard}>
              {alerts.map((alertItem, index) => (
                <View
                  key={alertItem.id}
                  style={[
                    styles.alertRow,
                    index < alerts.length - 1 && styles.alertRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.alertDot,
                      { backgroundColor: getAlertColor(alertItem.severity) },
                    ]}
                  />

                  <View style={styles.alertContent}>
                    <Text numberOfLines={1} style={styles.alertTitle}>
                      {alertItem.related_settlement_name
                        ? `${alertItem.title} – ${alertItem.related_settlement_name}`
                        : alertItem.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.alertSubtitle}>
                      {formatDisplayDate(alertItem.created_at)} •{' '}
                      {getAlertStatusLabel(alertItem.status)}
                    </Text>
                  </View>
                </View>
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
            </AppCard>
          ) : (
            <AppCard style={styles.alertsCard}>
              <Text style={styles.emptyTitle}>אין התראות חדשות</Text>
              <Text style={styles.emptyDescription}>לא זוהו חריגים להצגה כרגע.</Text>
            </AppCard>
          )}
        </SectionBlock>
      </AppRevealView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertsCta: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 4,
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
    height: 9,
    marginTop: 3,
    width: 9,
  },
  alertRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: 9,
    minHeight: 46,
    paddingVertical: 7,
  },
  alertRowBorder: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  alertSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'right',
  },
  alertTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'right',
  },
  alertsCard: {
    gap: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alertsPlaceholder: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    paddingVertical: 10,
    textAlign: 'right',
  },
  emptyDescription: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  featuredCard: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.info,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  featuredEmptyCard: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
    height: 42,
    width: '100%',
  },
  featuredSkeletonLine: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 12,
  },
  featuredSkeletonMeta: {
    height: 18,
    width: '82%',
  },
  featuredSkeletonTitle: {
    height: 34,
    width: '64%',
  },
  featuredSkeletonTop: {
    width: '24%',
  },
  hero: {
    gap: 2,
  },
  heroDate: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  heroGreeting: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'right',
  },
  heroSubtitle: {
    color: theme.colors.textDim,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 33,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenContent: {
    gap: 12,
  },
  systemCard: {
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  systemText: {
    color: theme.colors.textDim,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
  },
  systemTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  systemTopRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
});
