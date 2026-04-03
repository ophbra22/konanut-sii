import { StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { MetricCard } from '@/src/components/ui/metric-card';
import { PageHeader } from '@/src/components/ui/page-header';
import { useDashboardQuery } from '@/src/features/dashboard/hooks/use-dashboard-query';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';

function getSeverityLabel(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return 'גבוהה';
    case 'medium':
      return 'בינונית';
    default:
      return 'מידע';
  }
}

function getSeverityTone(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return 'danger' as const;
    case 'medium':
      return 'warning' as const;
    default:
      return 'info' as const;
  }
}

function getShortDescription(description: string | null) {
  const value = description?.trim();

  if (!value) {
    return 'ללא פירוט נוסף.';
  }

  return value;
}

export default function AlertsScreen() {
  const { data, error, isLoading, refetch } = useDashboardQuery();
  const alerts = data?.alertsSummary ?? [];
  const highCount = alerts.filter((item) => item.severity === 'high').length;
  const mediumCount = alerts.filter((item) => item.severity === 'medium').length;
  const lowCount = alerts.filter((item) => item.severity === 'low').length;

  if (isLoading) {
    return <AppLoader label="טוען את מרכז ההתראות..." />;
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="התראות"
        title="מרכז התראות"
        subtitle="חריגים ועדכוני מערכת אחרונים בתצוגה תפעולית קצרה."
      />

      <AppRevealView delay={30}>
        <View style={styles.metricsGrid}>
          <MetricCard label="גבוהות" tone="danger" value={String(highCount)} />
          <MetricCard label="בינוניות" tone="warning" value={String(mediumCount)} />
          <MetricCard label="מידע" tone="info" value={String(lowCount)} />
        </View>
      </AppRevealView>

      {error ? (
        <StateCard
          actionLabel="נסו שוב"
          description={error.message}
          onAction={() => {
            void refetch();
          }}
          title="לא הצלחנו לטעון התראות"
          variant="warning"
        />
      ) : null}

      {!error && !alerts.length ? (
        <StateCard
          description="אין כרגע התראות אחרונות להצגה."
          title="אין התראות פעילות"
        />
      ) : null}

      {!error && alerts.length ? (
        <AppRevealView delay={70}>
          <View style={styles.list}>
            {alerts.map((alertItem) => (
              <AppCard key={alertItem.id} style={styles.alertCard}>
                <View style={styles.cardHeader}>
                  <Text numberOfLines={1} style={styles.title}>
                    {alertItem.title}
                  </Text>

                  <AppBadge
                    label={getSeverityLabel(alertItem.severity)}
                    size="sm"
                    tone={getSeverityTone(alertItem.severity)}
                  />
                </View>

                <Text numberOfLines={2} style={styles.description}>
                  {getShortDescription(alertItem.description)}
                </Text>

                <View style={styles.metaRow}>
                  <Text numberOfLines={1} style={styles.metaText}>
                    {alertItem.related_settlement_name || 'ללא שיוך'}
                  </Text>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.metaText}>
                    {formatDisplayDate(alertItem.created_at)}
                  </Text>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text numberOfLines={1} style={styles.metaText}>
                    {alertItem.status === 'open' ? 'פתוחה' : 'טופלה'}
                  </Text>
                </View>
              </AppCard>
            ))}
          </View>
        </AppRevealView>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'space-between',
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  list: {
    gap: 8,
  },
  metaDivider: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
});
