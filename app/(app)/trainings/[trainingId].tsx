import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

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
import { trainingStatuses } from '@/src/features/trainings/constants';
import { useDeleteTrainingMutation, useUpdateTrainingStatusMutation } from '@/src/features/trainings/hooks/use-training-mutations';
import { useTrainingDetailsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export default function TrainingDetailsScreen() {
  const { trainingId } = useLocalSearchParams<{ trainingId: string }>();
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const deleteMutation = useDeleteTrainingMutation();
  const statusMutation = useUpdateTrainingStatusMutation();
  const { data, error, isLoading, refetch } = useTrainingDetailsQuery(trainingId);

  if (isLoading) {
    return <AppLoader label="טוען את פרטי האימון..." />;
  }

  if (error || !data) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          title="פרטי אימון"
          subtitle="לא הצלחנו להציג את נתוני האימון."
        />
        <StateCard
          actionLabel="חזרה לרשימת האימונים"
          description={error?.message ?? 'האימון המבוקש אינו זמין לחשבון המחובר.'}
          onAction={() => {
            router.replace('/trainings');
          }}
          title="האימון לא זמין"
          variant="warning"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="אימונים"
        title={data.title}
        subtitle="מסך פירוט הכולל יישובים משתתפים, משובים, שליטת סטטוס ונתוני תיאום."
      />

      <View style={styles.metricsGrid}>
        <MetricCard label="יישובים משתתפים" value={String(data.settlements.length)} />
        <MetricCard label="משובים" value={String(data.feedbacks.length)} />
        <MetricCard
          label="סטטוס"
          tone={data.status === 'הושלם' ? 'accent' : 'default'}
          value={data.status}
        />
      </View>

      <AppCard
        description={`${formatDisplayDate(data.training_date)} • ${formatDisplayTime(
          data.training_time
        )}`}
        title="פרטי אימון"
      >
        <View style={styles.badges}>
          <AppBadge label={data.training_type} tone="accent" />
          <AppBadge label={data.status} tone={getTrainingStatusTone(data.status)} />
        </View>
        <DataRow label="מיקום" value={data.location?.trim() || 'לא הוגדר'} />
        <DataRow label="מדריך" value={data.instructor?.full_name || 'טרם שובץ'} />
        <DataRow label="הערות" value={data.notes?.trim() || 'אין הערות'} />
      </AppCard>

      {isSuperAdmin(role) ? (
        <AppCard
          description="עדכון הסטטוס משפיע על הדשבורד ועל חישוב דירוגי היישובים."
          title="שליטת סטטוס"
          variant="accent"
        >
          <View style={styles.statusActions}>
            {trainingStatuses.map((status) => (
              <AppButton
                key={status}
                disabled={status === data.status || statusMutation.isPending}
                fullWidth={false}
                label={status}
                onPress={() => {
                  void statusMutation.mutateAsync({
                    status,
                    trainingId: data.id,
                  });
                }}
                style={styles.statusButton}
                variant={status === data.status ? 'primary' : 'secondary'}
              />
            ))}
          </View>
        </AppCard>
      ) : null}

      <SectionBlock
        description="היישובים המשתתפים באימון. היישוב הוא יחידת הכוננות המרכזית במערכת."
        title="יישובים משתתפים"
      >
        {data.settlements.length ? (
          <View style={styles.list}>
            {data.settlements.map((settlement) => (
              <AppCard
                key={settlement.id}
                description={settlement.area}
                style={styles.innerCard}
                title={settlement.name}
              >
                <AppButton
                  fullWidth={false}
                  href={`/settlements/${settlement.id}`}
                  label="מעבר ליישוב"
                  variant="secondary"
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard description="עדיין לא שויכו יישובים לאימון זה." title="אין שיוכים" />
        )}
      </SectionBlock>

      <SectionBlock
        description="משוב לכל יישוב משתתף, על בסיס הטבלאות feedbacks ו-training_settlements."
        title="משובים לפי יישוב"
      >
        {data.feedbacks.length ? (
          <View style={styles.list}>
            {data.feedbacks.map((feedback) => (
              <AppCard
                key={feedback.id}
                description={feedback.comment?.trim() || 'לא נמסר פירוט חופשי.'}
                style={styles.innerCard}
                title={feedback.settlement?.name || 'יישוב לא זמין'}
              >
                <View style={styles.badges}>
                  <AppBadge label={`דירוג ${feedback.rating}/5`} tone="accent" />
                </View>
                <DataRow
                  label="אזור"
                  value={feedback.settlement?.area || 'לא ידוע'}
                />
                <DataRow
                  label="מדריך"
                  value={feedback.instructor?.full_name || 'לא הוגדר'}
                />
                <DataRow
                  label="תאריך יצירה"
                  value={formatDisplayDate(feedback.created_at)}
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard description="עדיין לא הוזנו משובים עבור האימון." title="אין משובים" />
        )}
      </SectionBlock>

      <AppCard description="רק מנהל מערכת יכול לערוך או למחוק אימון." title="פעולות">
        <View style={styles.actions}>
          <AppButton
            fullWidth={false}
            href="/trainings"
            label="חזרה לרשימה"
            style={styles.actionButton}
            variant="ghost"
          />
          {isSuperAdmin(role) ? (
            <AppButton
              fullWidth={false}
              href={`/trainings/${data.id}/edit`}
              label="עריכת אימון"
              style={styles.actionButton}
              variant="secondary"
            />
          ) : null}
          {isSuperAdmin(role) ? (
            <AppButton
              disabled={deleteMutation.isPending}
              fullWidth={false}
              label="מחיקת אימון"
              onPress={() => {
                Alert.alert(
                  'מחיקת אימון',
                  `האם למחוק את ${data.title}?`,
                  [
                    { style: 'cancel', text: 'ביטול' },
                    {
                      style: 'destructive',
                      text: 'מחיקה',
                      onPress: () => {
                        void deleteMutation
                          .mutateAsync(data.id)
                          .then(() => {
                            router.replace('/trainings');
                          });
                      },
                    },
                  ]
                );
              }}
              style={styles.actionButton}
              variant="danger"
            />
          ) : null}
          <AppButton
            fullWidth={false}
            label="רענון נתונים"
            onPress={() => {
              void refetch();
            }}
            style={styles.actionButton}
            variant="secondary"
          />
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
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
  statusActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusButton: {
    flex: 1,
  },
});
