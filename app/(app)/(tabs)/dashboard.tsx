import { StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { DataRow } from '@/src/components/ui/data-row';
import { MetricCard } from '@/src/components/ui/metric-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { useDashboardQuery } from '@/src/features/dashboard/hooks/use-dashboard-query';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

function getAlertTone(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    default:
      return 'neutral';
  }
}

export default function DashboardScreen() {
  const role = useAuthStore((state) => state.role);
  const { data, error, isLoading, refetch } = useDashboardQuery();

  if (isLoading) {
    return <AppLoader label="טוען את תמונת המצב המבצעית..." />;
  }

  if (error || !data) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="חמ״ל דיגיטלי"
          title="לוח בקרה"
          subtitle="מרכז השליטה לא הצליח לטעון כרגע את הנתונים התפעוליים."
        />
        <StateCard
          actionLabel="נסו שוב"
          description={error?.message ?? 'אירעה שגיאה בטעינת הדשבורד.'}
          onAction={() => {
            void refetch();
          }}
          title="הדשבורד לא זמין כרגע"
          variant="warning"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="חמ״ל דיגיטלי"
        title="לוח בקרה"
        subtitle="תמונת מצב תפעולית בזמן אמת: אימונים, כשירות, התראות ופערי משוב."
      />

      <View style={styles.quickActions}>
        <AppButton
          fullWidth={false}
          href="/settlement-rankings"
          label="דירוגי יישובים"
          style={styles.quickAction}
          variant="secondary"
        />
        {isSuperAdmin(role) ? (
          <AppButton
            fullWidth={false}
            href="/settlements/create"
            label="יצירת יישוב"
            style={styles.quickAction}
          />
        ) : null}
        {isSuperAdmin(role) ? (
          <AppButton
            fullWidth={false}
            href="/trainings/create"
            label="יצירת אימון"
            style={styles.quickAction}
          />
        ) : null}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="אימונים שהושלמו החודש"
          tone="accent"
          value={String(data.completedTrainingsThisMonth)}
        />
        <MetricCard label="אימונים השבוע" value={String(data.trainingsThisWeek)} />
        <MetricCard
          label="יישובים פעילים"
          value={String(data.activeSettlementsCount)}
        />
        <MetricCard
          label="חוסרי משוב"
          tone="warning"
          value={String(data.missingFeedbackCount)}
        />
      </View>

      <AppCard
        description="לפי הגדרת המערכת בשלב זה, סטטוס המערכת תמיד מבצעי."
        title="סטטוס מערכת"
        variant="accent"
      >
        <View style={styles.badges}>
          <AppBadge label={data.systemStatus} tone="accent" />
          <AppBadge label="מרכז שליטה פעיל" tone="neutral" />
        </View>
      </AppCard>

      <SectionBlock
        description="חמש ההתראות האחרונות הזמינות לחשבון המחובר."
        title="סיכום התראות"
      >
        {data.alertsSummary.length ? (
          <View style={styles.list}>
            {data.alertsSummary.map((alertItem) => (
              <AppCard
                key={alertItem.id}
                description={alertItem.description?.trim() || 'ללא פירוט נוסף'}
                style={styles.innerCard}
                title={alertItem.title}
              >
                <View style={styles.badges}>
                  <AppBadge label={alertItem.type} tone="neutral" />
                  <AppBadge
                    label={alertItem.severity}
                    tone={getAlertTone(alertItem.severity)}
                  />
                  <AppBadge label={alertItem.status} tone="warning" />
                </View>
                <DataRow
                  label="יישוב קשור"
                  value={alertItem.related_settlement_name || 'ללא שיוך'}
                />
                <DataRow
                  label="תאריך פתיחה"
                  value={formatDisplayDate(alertItem.created_at)}
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard description="אין התראות פתוחות או אחרונות להצגה." title="אין התראות" />
        )}
      </SectionBlock>

      <SectionBlock
        description="רשימת האימונים הקרובים שאינם מבוטלים."
        title="אימונים קרובים"
      >
        {data.upcomingTrainings.length ? (
          <View style={styles.list}>
            {data.upcomingTrainings.map((training) => (
              <AppCard
                key={training.id}
                description={`${formatDisplayDate(training.training_date)} • ${formatDisplayTime(
                  training.training_time
                )}`}
                style={styles.innerCard}
                title={training.title}
              >
                <View style={styles.badges}>
                  <AppBadge label={training.training_type} tone="accent" />
                  <AppBadge label={training.status} tone="neutral" />
                </View>
                <DataRow
                  label="יישובים"
                  value={training.settlements.join(', ') || 'ללא שיוך'}
                />
                <AppButton
                  fullWidth={false}
                  href={`/trainings/${training.id}`}
                  label="מעבר לאימון"
                  variant="secondary"
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard description="אין אימונים קרובים להצגה." title="לוח האימונים פנוי" />
        )}
      </SectionBlock>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  innerCard: {
    padding: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickAction: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
