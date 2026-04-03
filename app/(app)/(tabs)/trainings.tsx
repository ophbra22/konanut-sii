import { StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { MetricCard } from '@/src/components/ui/metric-card';
import { PageHeader } from '@/src/components/ui/page-header';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { TrainingListCard } from '@/src/features/trainings/components/training-list-card';
import { useTrainingsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export default function TrainingsScreen() {
  const role = useAuthStore((state) => state.role);
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

      <View style={styles.topActions}>
        {isSuperAdmin(role) ? (
          <AppButton
            fullWidth={false}
            href="/trainings/create"
            label="יצירת אימון"
            style={styles.topAction}
          />
        ) : null}
      </View>

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
            <TrainingListCard
              key={training.id}
              footer={
                <View style={styles.cardActions}>
                  <AppButton
                    fullWidth={false}
                    href={`/trainings/${training.id}`}
                    label="פרטים"
                    style={styles.cardAction}
                    variant="secondary"
                  />
                  {isSuperAdmin(role) ? (
                    <AppButton
                      fullWidth={false}
                      href={`/trainings/${training.id}/edit`}
                      label="עריכה"
                      style={styles.cardAction}
                      variant="ghost"
                    />
                  ) : null}
                </View>
              }
              training={training}
            />
          ))}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardAction: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  topAction: {
    flex: 1,
  },
  topActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
