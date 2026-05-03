import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, StyleSheet, Share, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import {
  canCreateFeedbacks,
  canDeleteTrainings,
  canManageTrainings,
} from '@/src/features/auth/lib/permissions';
import { TrainingFeedbackForm } from '@/src/features/trainings/components/training-feedback-form';
import {
  ActionsCard,
  AttendanceCard,
  FeedbackCard,
  HeroCard,
  ScoreBreakdownCard,
  SnapshotCard,
} from '@/src/features/trainings/components/training-summary-cards';
import {
  useDeleteTrainingMutation,
  useDeleteTrainingFeedbackMutation,
  useSaveTrainingFeedbackMutation,
  useUpdateTrainingStatusMutation,
} from '@/src/features/trainings/hooks/use-training-mutations';
import { useTrainingDetailsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import {
  addTrainingToDeviceCalendar,
  DeviceCalendarError,
} from '@/src/features/trainings/lib/device-calendar';
import { buildTrainingCompletionSummary } from '@/src/features/trainings/lib/training-completion-summary';
import {
  getTrainingOperationalScore,
  summaryColors,
} from '@/src/features/trainings/lib/training-summary-helpers';
import { useAuthStore } from '@/src/stores/auth-store';
import { useFeedbackStore } from '@/src/stores/feedback-store';

export default function TrainingDetailsScreen() {
  const { openFeedback, trainingId } = useLocalSearchParams<{
    openFeedback?: string;
    trainingId: string;
  }>();
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const showToast = useFeedbackStore((state) => state.showToast);
  const router = useRouter();
  const deleteTrainingMutation = useDeleteTrainingMutation();
  const deleteFeedbackMutation = useDeleteTrainingFeedbackMutation();
  const feedbackMutation = useSaveTrainingFeedbackMutation();
  const statusMutation = useUpdateTrainingStatusMutation();
  const { data, error, isLoading } = useTrainingDetailsQuery(trainingId);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [isFeedbackFormVisible, setIsFeedbackFormVisible] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const canManageFeedback = canCreateFeedbacks(role);
  const canDeleteTraining = canDeleteTrainings(role);
  const canEditTraining = canManageTrainings(role);

  useEffect(() => {
    if (openFeedback === '1' && canManageFeedback && profile) {
      setEditingFeedbackId(null);
      setIsFeedbackFormVisible(true);
    }
  }, [canManageFeedback, openFeedback, profile]);

  if (isLoading) {
    return <AppLoader label="טוען את פרטי האימון..." />;
  }

  if (error || !data) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          subtitle="לא הצלחנו להציג את נתוני האימון."
          title="פרטי אימון"
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

  const training = data;
  const feedback = training.feedbacks[0] ?? null;
  const editingFeedback =
    training.feedbacks.find((item) => item.id === editingFeedbackId) ?? feedback;
  const score = getTrainingOperationalScore(training.averageFeedbackRating);

  async function handleShareCompletionSummary() {
    try {
      const summary = buildTrainingCompletionSummary(training);

      if (!summary.trim()) {
        Alert.alert('לא ניתן להכין את סיכום האימון', 'נסו שוב בעוד רגע.');
        return;
      }

      await Share.share({
        message: summary,
        title: `סיכום אימון - ${training.title}`,
      });
    } catch {
      Alert.alert('לא ניתן לשתף את סיכום האימון', 'לא הצלחנו לפתוח את חלונית השיתוף כרגע.');
    }
  }

  async function handleAddToCalendar() {
    setIsAddingToCalendar(true);

    try {
      await addTrainingToDeviceCalendar(training);
      showToast('האימון נוסף ליומן', 'success');
    } catch (error) {
      if (error instanceof DeviceCalendarError) {
        if (error.code === 'permission_denied') {
          Alert.alert('נדרשת גישה ליומן', error.message);
          return;
        }

        if (error.code === 'permission_blocked') {
          Alert.alert('הגישה ליומן חסומה', error.message, [
            { style: 'cancel', text: 'ביטול' },
            {
              onPress: () => {
                void Linking.openSettings();
              },
              text: 'פתיחת הגדרות',
            },
          ]);
          return;
        }
      }

      showToast('לא ניתן להוסיף את האימון ליומן', 'error');
    } finally {
      setIsAddingToCalendar(false);
    }
  }

  function handleDeleteTraining() {
    if (deleteTrainingMutation.isPending) {
      return;
    }

    Alert.alert(
      'מחיקת אימון',
      'האם אתה בטוח שברצונך למחוק את האימון? לא ניתן לשחזר פעולה זו.',
      [
        { style: 'cancel', text: 'ביטול' },
        {
          onPress: () => {
            void deleteTrainingMutation
              .mutateAsync(training.id)
              .then((result) => {
                if (!result.success) {
                  Alert.alert('לא ניתן למחוק את האימון', result.message);
                  return;
                }

                Alert.alert('מחיקת אימון', 'האימון נמחק בהצלחה', [
                  {
                    onPress: () => {
                      router.replace('/trainings');
                    },
                    text: 'אישור',
                  },
                ]);
              })
              .catch(() => {
                Alert.alert('לא ניתן למחוק את האימון', 'אירעה שגיאה לא צפויה. נסו שוב.');
              });
          },
          style: 'destructive',
          text: 'מחק',
        },
      ]
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <PageHeader
        eyebrow="אימונים"
        subtitle="סיכום נקי של סטטוס, מוכנות, השתתפות ומשוב."
        title="סיכום אימון"
      />

      <AppRevealView delay={20}>
        <HeroCard score={score} training={training} />
      </AppRevealView>

      <AppRevealView delay={40}>
        <SnapshotCard feedback={feedback} training={training} />
      </AppRevealView>

      <AppRevealView delay={60}>
        <ScoreBreakdownCard score={score} />
      </AppRevealView>

      <AppRevealView delay={80}>
        <AttendanceCard
          canEdit={canEditTraining}
          onAddData={() => {
            router.push(`/trainings/${training.id}/edit`);
          }}
          training={training}
        />
      </AppRevealView>

      <AppRevealView delay={100}>
        <FeedbackCard
          canDelete={canEditTraining && Boolean(feedback)}
          canEdit={canManageFeedback && Boolean(profile)}
          feedback={feedback}
          isFormVisible={isFeedbackFormVisible}
          onAdd={() => {
            setEditingFeedbackId(null);
            setIsFeedbackFormVisible(true);
          }}
          onDelete={() => {
            if (!feedback) {
              return;
            }

            Alert.alert('מחיקת משוב', 'האם למחוק את משוב המדריך על האימון?', [
              { style: 'cancel', text: 'ביטול' },
              {
                onPress: () => {
                  void deleteFeedbackMutation.mutateAsync({
                    feedbackId: feedback.id,
                    trainingId: training.id,
                  });
                },
                style: 'destructive',
                text: 'מחיקה',
              },
            ]);
          }}
          onEdit={() => {
            setEditingFeedbackId(feedback?.id ?? null);
            setIsFeedbackFormVisible(true);
          }}
          training={training}
        />
      </AppRevealView>

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

      {!profile && canManageFeedback ? (
        <StateCard
          description="לא הצלחנו לזהות את פרופיל המשתמש המחובר, ולכן אי אפשר לשמור משוב כרגע."
          title="פרופיל לא זמין"
          variant="warning"
        />
      ) : null}

      {isFeedbackFormVisible && profile ? (
        <TrainingFeedbackForm
          initialValues={
            editingFeedback
              ? {
                  comment: editingFeedback.comment ?? '',
                  rating: editingFeedback.rating,
                }
              : undefined
          }
          isSubmitting={feedbackMutation.isPending}
          isUpdating={Boolean(feedback)}
          onCancel={() => {
            setEditingFeedbackId(null);
            setIsFeedbackFormVisible(false);
          }}
          onSubmit={async (values) => {
            await feedbackMutation.mutateAsync({
              comment: values.comment || null,
              feedbackId: feedback?.id,
              instructorId: profile.id,
              rating: values.rating,
              trainingId: training.id,
            });

            setEditingFeedbackId(null);
            setIsFeedbackFormVisible(false);
          }}
        />
      ) : null}

      <AppRevealView delay={120}>
        <ActionsCard
          canDelete={canDeleteTraining}
          canEdit={canEditTraining}
          canMarkComplete={canEditTraining && training.status !== 'הושלם'}
          isAddingToCalendar={isAddingToCalendar}
          isCompleting={statusMutation.isPending}
          isDeleting={deleteTrainingMutation.isPending}
          onAddToCalendar={() => {
            void handleAddToCalendar();
          }}
          onDelete={handleDeleteTraining}
          onEdit={() => {
            router.push(`/trainings/${training.id}/edit`);
          }}
          onMarkComplete={() => {
            void statusMutation.mutateAsync({
              status: 'הושלם',
              trainingId: training.id,
            });
          }}
          onShareSummary={() => {
            void handleShareCompletionSummary();
          }}
        />
      </AppRevealView>

      <View style={styles.bottomSpacer} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 4,
  },
  screenContent: {
    backgroundColor: summaryColors.background,
    gap: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
