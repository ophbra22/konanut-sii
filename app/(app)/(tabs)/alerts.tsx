import { StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import type { DashboardAlertItem } from '@/src/features/dashboard/api/dashboard-service';
import { useDashboardQuery } from '@/src/features/dashboard/hooks/use-dashboard-query';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

function getSeverityColor(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return theme.colors.danger;
    case 'medium':
      return theme.colors.warning;
    default:
      return theme.colors.accentStrong;
  }
}

function getShortDescription(description: string | null) {
  const value = description?.trim();

  if (!value) {
    return 'ללא פירוט נוסף.';
  }

  return value;
}

function getStatusLabel(status: DashboardAlertItem['status']) {
  return status === 'open' ? 'פתוחה' : 'טופלה';
}

function AlertSummaryTile({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'danger' | 'info' | 'warning';
  value: string;
}) {
  return (
    <View style={[styles.summaryTile, summaryToneStyles[tone]]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function AlertStatusBadge({
  status,
}: {
  status: DashboardAlertItem['status'];
}) {
  const isOpen = status === 'open';

  return (
    <View style={[styles.statusBadge, isOpen ? styles.statusBadgeOpen : styles.statusBadgeResolved]}>
      <Text style={[styles.statusBadgeText, isOpen ? styles.statusBadgeTextOpen : styles.statusBadgeTextResolved]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

function AlertListItem({
  alertItem,
  isLast,
}: {
  alertItem: DashboardAlertItem;
  isLast: boolean;
}) {
  return (
    <View style={[styles.alertRow, !isLast ? styles.alertRowBorder : null]}>
      <AlertStatusBadge status={alertItem.status} />

      <View style={styles.alertContent}>
        <Text numberOfLines={1} style={styles.title}>
          {alertItem.title}
        </Text>

        <Text numberOfLines={1} style={styles.subtitle}>
          {alertItem.related_settlement_name || 'ללא שיוך'} • {formatDisplayDate(alertItem.created_at)} •{' '}
          {alertItem.type}
        </Text>

        <Text numberOfLines={2} style={styles.description}>
          {getShortDescription(alertItem.description)}
        </Text>
      </View>

      <View
        style={[
          styles.alertDot,
          { backgroundColor: getSeverityColor(alertItem.severity) },
        ]}
      />
    </View>
  );
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
    <AppScreen contentContainerStyle={styles.screenContent}>
      <PageHeader
        eyebrow="התראות"
        title="מרכז התראות"
        subtitle="חריגים ועדכוני מערכת אחרונים בתצוגה תפעולית קצרה."
      />

      <AppRevealView delay={30}>
        <View style={styles.summaryRow}>
          <AlertSummaryTile label="גבוהות" tone="danger" value={String(highCount)} />
          <AlertSummaryTile label="בינוניות" tone="warning" value={String(mediumCount)} />
          <AlertSummaryTile label="מידע" tone="info" value={String(lowCount)} />
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
          <SectionBlock
            description="רשימת החריגים האחרונים במבנה תפעולי מרוכז"
            title="התראות אחרונות"
          >
            <View style={styles.list}>
              {alerts.map((alertItem, index) => (
                <AlertListItem
                  key={alertItem.id}
                  alertItem={alertItem}
                  isLast={index === alerts.length - 1}
                />
              ))}
            </View>
          </SectionBlock>
        </AppRevealView>
      ) : null}
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  alertContent: {
    flex: 1,
    gap: 6,
  },
  alertDot: {
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  alertRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: 12,
    minHeight: 72,
    paddingVertical: 12,
  },
  alertRowBorder: {
    borderBottomColor: theme.colors.separatorStrong,
    borderBottomWidth: 1,
  },
  description: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'right',
  },
  list: {
    gap: 0,
  },
  screenContent: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  statusBadge: {
    borderRadius: 999,
    marginTop: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeOpen: {
    backgroundColor: theme.colors.statusOpenSurface,
  },
  statusBadgeResolved: {
    backgroundColor: theme.colors.statusResolvedSurface,
  },
  statusBadgeText: {
    ...theme.typography.badge,
    textAlign: 'center',
  },
  statusBadgeTextOpen: {
    color: theme.colors.warning,
  },
  statusBadgeTextResolved: {
    color: theme.colors.accentStrong,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'right',
  },
  summaryLabel: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
  summaryTile: {
    borderRadius: 14,
    flex: 1,
    gap: 6,
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryValue: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'right',
  },
}));

const summaryToneStyles = createThemedStyles((theme: AppTheme) => ({
  danger: {
    backgroundColor: theme.colors.surfaceDanger,
  },
  info: {
    backgroundColor: theme.colors.surface,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
  },
}));
