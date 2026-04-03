import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { DataRow } from '@/src/components/ui/data-row';
import { MetricCard } from '@/src/components/ui/metric-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import {
  canCreateFeedbacks,
  isSuperAdmin,
} from '@/src/features/auth/lib/permissions';
import { TrainingFeedbackCard } from '@/src/features/trainings/components/training-feedback-card';
import { TrainingFeedbackForm } from '@/src/features/trainings/components/training-feedback-form';
import { trainingStatuses } from '@/src/features/trainings/constants';
import {
  useDeleteTrainingFeedbackMutation,
  useDeleteTrainingMutation,
  useSaveTrainingFeedbackMutation,
  useUpdateTrainingStatusMutation,
} from '@/src/features/trainings/hooks/use-training-mutations';
import { useTrainingDetailsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

type TrainingSection = 'details' | 'feedbacks';

export default function TrainingDetailsScreen() {
  const { trainingId } = useLocalSearchParams<{ trainingId: string }>();
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const deleteMutation = useDeleteTrainingMutation();
  const deleteFeedbackMutation = useDeleteTrainingFeedbackMutation();
  const feedbackMutation = useSaveTrainingFeedbackMutation();
  const statusMutation = useUpdateTrainingStatusMutation();
  const { data, error, isLoading, refetch } = useTrainingDetailsQuery(trainingId);
  const [activeSection, setActiveSection] = useState<TrainingSection>('details');
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [isFeedbackFormVisible, setIsFeedbackFormVisible] = useState(false);

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

  const canManageFeedback = canCreateFeedbacks(role);
  const editingFeedback =
    data.feedbacks.find((feedback) => feedback.id === editingFeedbackId) ?? null;

  return (
    <AppScreen>
      <PageHeader
        eyebrow="אימונים"
        title={data.title}
        subtitle="מסך מבצעי מלא עם לשוניות לפרטי אימון ולניהול משובים לפי יישוב."
      />

      <View style={styles.metricsGrid}>
        <MetricCard label="יישובים משתתפים" value={String(data.settlements.length)} />
        <MetricCard label="משובים" value={String(data.feedbackCount)} />
        <MetricCard
          label="ממוצע דירוג"
          tone={data.averageFeedbackRating ? 'accent' : 'default'}
          value={data.averageFeedbackRating ? data.averageFeedbackRating.toFixed(1) : '—'}
        />
        <MetricCard
          label="חסרי משוב"
          tone={data.missingFeedbackSettlements.length ? 'warning' : 'accent'}
          value={String(data.missingFeedbackSettlements.length)}
        />
      </View>

      <View style={styles.tabs}>
        <AppChip
          label="פרטים"
          onPress={() => {
            setActiveSection('details');
          }}
          selected={activeSection === 'details'}
          tone={activeSection === 'details' ? 'accent' : 'neutral'}
        />
        <AppChip
          label="משובים"
          onPress={() => {
            setActiveSection('feedbacks');
          }}
          selected={activeSection === 'feedbacks'}
          tone={activeSection === 'feedbacks' ? 'accent' : 'neutral'}
        />
      </View>

      {activeSection === 'details' ? (
        <>
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
              description="עדכון הסטטוס משפיע על הדשבורד, על היומן ועל חישוב דירוגי היישובים."
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
                    Alert.alert('מחיקת אימון', `האם למחוק את ${data.title}?`, [
                      { style: 'cancel', text: 'ביטול' },
                      {
                        style: 'destructive',
                        text: 'מחיקה',
                        onPress: () => {
                          void deleteMutation.mutateAsync(data.id).then(() => {
                            router.replace('/trainings');
                          });
                        },
                      },
                    ]);
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
        </>
      ) : null}

      {activeSection === 'feedbacks' ? (
        <>
          <SectionBlock
            description="משוב אחד לכל יישוב באימון. היישובים החסרים מחושבים לפי training_settlements מול feedbacks."
            title="תמונת משובים"
          >
            <View style={styles.metricsGrid}>
              <MetricCard
                label="ממוצע דירוג"
                tone={data.averageFeedbackRating ? 'accent' : 'default'}
                value={data.averageFeedbackRating ? data.averageFeedbackRating.toFixed(1) : '—'}
              />
              <MetricCard label="כמות משובים" value={String(data.feedbackCount)} />
              <MetricCard
                label="חסרי משוב"
                tone={data.missingFeedbackSettlements.length ? 'warning' : 'accent'}
                value={String(data.missingFeedbackSettlements.length)}
              />
            </View>

            {data.missingFeedbackSettlements.length ? (
              <AppCard
                description="היישובים הבאים עדיין משתתפים באימון אך לא קיים עבורם משוב שמור."
                title="יישובים ללא משוב"
                variant="warning"
              >
                <View style={styles.badges}>
                  {data.missingFeedbackSettlements.map((settlement) => (
                    <AppBadge
                      key={settlement.id}
                      label={`${settlement.name} • ${settlement.area}`}
                      tone="warning"
                    />
                  ))}
                </View>
              </AppCard>
            ) : (
              <StateCard
                description="לכל היישובים המשתתפים באימון כבר קיים משוב שמור."
                title="כיסוי משובים מלא"
                variant="accent"
              />
            )}
          </SectionBlock>

          {canManageFeedback ? (
            <SectionBlock
              description="מדריך ומנהל מערכת יכולים להוסיף משוב חדש או לעדכן משוב קיים. מחיקה זמינה למנהל מערכת בלבד."
              title="ניהול משובים"
            >
              {feedbackMutation.error ? (
                <StateCard
                  description={feedbackMutation.error.message}
                  title="לא ניתן לשמור את המשוב"
                  variant="warning"
                />
              ) : null}

              {deleteFeedbackMutation.error ? (
                <StateCard
                  description={deleteFeedbackMutation.error.message}
                  title="לא ניתן למחוק את המשוב"
                  variant="warning"
                />
              ) : null}

              {!profile ? (
                <StateCard
                  description="לא הצלחנו לזהות את פרופיל המשתמש המחובר, ולכן אי אפשר לשמור משוב כרגע."
                  title="פרופיל לא זמין"
                  variant="warning"
                />
              ) : null}

              {!isFeedbackFormVisible && profile ? (
                <AppButton
                  fullWidth={false}
                  label="הוספת משוב"
                  onPress={() => {
                    setEditingFeedbackId(null);
                    setIsFeedbackFormVisible(true);
                  }}
                  variant="secondary"
                />
              ) : null}

              {isFeedbackFormVisible && profile ? (
                <TrainingFeedbackForm
                  existingFeedbacks={data.feedbacks}
                  initialValues={
                    editingFeedback
                      ? {
                          comment: editingFeedback.comment ?? '',
                          rating: editingFeedback.rating,
                          settlement_id:
                            editingFeedback.settlement?.id ?? editingFeedback.settlement_id,
                        }
                      : {
                          settlement_id:
                            data.missingFeedbackSettlements[0]?.id ??
                            data.settlements[0]?.id ??
                            '',
                        }
                  }
                  isSubmitting={feedbackMutation.isPending}
                  isUpdating={Boolean(editingFeedback)}
                  lockSettlement={Boolean(editingFeedback)}
                  onCancel={() => {
                    setEditingFeedbackId(null);
                    setIsFeedbackFormVisible(false);
                  }}
                  onSubmit={async (values) => {
                    await feedbackMutation.mutateAsync({
                      comment: values.comment || null,
                      feedbackId: editingFeedback?.id,
                      instructorId: profile.id,
                      rating: values.rating,
                      settlementId: values.settlement_id,
                      trainingId: data.id,
                    });

                    setEditingFeedbackId(null);
                    setIsFeedbackFormVisible(false);
                  }}
                  settlementOptions={data.settlements}
                />
              ) : null}
            </SectionBlock>
          ) : null}

          <SectionBlock
            description="כל רשומות המשוב הקיימות עבור האימון, כולל דירוג, הערת מדריך ותאריך יצירה."
            title="רשומות משוב"
          >
            {data.feedbacks.length ? (
              <View style={styles.list}>
                {data.feedbacks.map((feedback) => (
                  <TrainingFeedbackCard
                    key={feedback.id}
                    canDelete={isSuperAdmin(role)}
                    canEdit={canManageFeedback}
                    feedback={feedback}
                    onDelete={() => {
                      Alert.alert(
                        'מחיקת משוב',
                        `האם למחוק את המשוב עבור ${feedback.settlement?.name || 'היישוב'}?`,
                        [
                          { style: 'cancel', text: 'ביטול' },
                          {
                            style: 'destructive',
                            text: 'מחיקה',
                            onPress: () => {
                              void deleteFeedbackMutation.mutateAsync({
                                feedbackId: feedback.id,
                                trainingId: data.id,
                              });
                            },
                          },
                        ]
                      );
                    }}
                    onEdit={() => {
                      setEditingFeedbackId(feedback.id);
                      setIsFeedbackFormVisible(true);
                    }}
                  />
                ))}
              </View>
            ) : (
              <StateCard
                description="עדיין לא הוזנו משובים עבור האימון. ניתן להתחיל ביישובים שמופיעים תחת חסרי משוב."
                title="אין משובים"
              />
            )}
          </SectionBlock>
        </>
      ) : null}
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
  tabs: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
