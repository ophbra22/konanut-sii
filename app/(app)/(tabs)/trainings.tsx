import { StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { TrainingListCard } from '@/src/features/trainings/components/training-list-card';
import { useTrainingsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { theme } from '@/src/theme';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <AppCard style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

export default function TrainingsScreen() {
  const { data, error, isLoading, refetch } = useTrainingsQuery();

  if (isLoading) {
    return <AppLoader label="טוען את רשימת האימונים..." />;
  }

  const trainings = data ?? [];
  const plannedCount = trainings.filter((item) => item.status === 'מתוכנן').length;
  const completedCount = trainings.filter((item) => item.status === 'הושלם').length;

  return (
    <AppScreen>
      <PageHeader
        eyebrow="אימונים"
        title="ניהול אימונים"
        subtitle="המסך מחובר כעת לשכבת הנתונים האמיתית של Supabase ומציג רק אימונים הנגישים למשתמש המחובר."
      />

      <View style={styles.metricsGrid}>
        <MetricCard label="אימונים נגישים" value={String(trainings.length)} />
        <MetricCard label="מתוכננים" value={String(plannedCount)} />
        <MetricCard label="הושלמו" value={String(completedCount)} />
      </View>

      {error ? (
        <StateCard
          actionLabel="נסו שוב"
          description={error.message}
          onAction={() => {
            void refetch();
          }}
          title="לא הצלחנו לטעון את האימונים"
          variant="warning"
        />
      ) : null}

      {!error && !trainings.length ? (
        <StateCard
          actionLabel="רענון"
          description="כרגע אין אימונים נגישים לחשבון המחובר. אפשר לבדוק שיוכים בין trainings ל-settlements ולנסות שוב."
          onAction={() => {
            void refetch();
          }}
          title="אין אימונים להצגה"
        />
      ) : null}

      {!error && trainings.length ? (
        <View style={styles.list}>
          {trainings.map((training) => (
            <TrainingListCard key={training.id} training={training} />
          ))}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  metricValue: {
    color: theme.colors.accentStrong,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
});
