import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  MessageSquarePlus,
  Share2,
  SquarePen,
  X,
} from 'lucide-react-native';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import {
  canCreateFeedbacks,
  canManageTrainings,
} from '@/src/features/auth/lib/permissions';
import { TrainingFeedbackCard } from '@/src/features/trainings/components/training-feedback-card';
import { TrainingFeedbackForm } from '@/src/features/trainings/components/training-feedback-form';
import {
  useDeleteTrainingFeedbackMutation,
  useSaveTrainingFeedbackMutation,
  useUpdateTrainingStatusMutation,
} from '@/src/features/trainings/hooks/use-training-mutations';
import { useTrainingDetailsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import type { TrainingStatus } from '@/src/types/database';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type ActionButtonProps = {
  disabled?: boolean;
  icon: ComponentType<{ color: string; size: number }>;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
};

type CompactChipProps = {
  label: string;
  tone?: 'neutral' | 'warning';
};

type StatusChecklistItemProps = {
  completed: boolean;
  label: string;
};

function ActionButton({
  disabled = false,
  icon: Icon,
  label,
  onPress,
  tone = 'secondary',
}: ActionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButtonBase,
        tone === 'primary' ? styles.actionButtonPrimary : styles.actionButtonSecondary,
        disabled && styles.actionButtonDisabled,
        pressed && !disabled && styles.actionButtonPressed,
      ]}
    >
      <Icon
        color={tone === 'primary' ? theme.colors.background : theme.colors.textPrimary}
        size={15}
      />
      <Text
        style={[
          styles.actionButtonLabel,
          tone === 'primary'
            ? styles.actionButtonLabelPrimary
            : styles.actionButtonLabelSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CompactChip({ label, tone = 'neutral' }: CompactChipProps) {
  return (
    <View
      style={[
        styles.compactChip,
        tone === 'warning' ? styles.compactChipWarning : styles.compactChipNeutral,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.compactChipLabel,
          tone === 'warning'
            ? styles.compactChipLabelWarning
            : styles.compactChipLabelNeutral,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusChecklistItem({
  completed,
  label,
}: StatusChecklistItemProps) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.checklistLabel}>{label}</Text>

      <View style={styles.statusStateGroup}>
        <Text
          style={[
            styles.checklistState,
            completed ? styles.checklistStateComplete : styles.checklistStateMissing,
          ]}
        >
          {completed ? 'הושלם' : 'חסר'}
        </Text>
        {completed ? (
          <Check color={theme.colors.accentStrong} size={14} />
        ) : (
          <X color={theme.colors.danger} size={14} />
        )}
      </View>
    </View>
  );
}

function getOperationalScore(averageFeedbackRating: number | null) {
  if (!averageFeedbackRating) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(averageFeedbackRating * 20)));
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return 'accent';
  }

  if (score >= 60) {
    return 'warning';
  }

  return 'danger';
}

function getStatusLabelValue(status: TrainingStatus) {
  switch (status) {
    case 'הושלם':
      return 'בוצע';
    case 'בוטל':
      return 'מבוטל';
    case 'נדחה':
      return 'נדחה';
    default:
      return 'מתוכנן';
  }
}

export default function TrainingDetailsScreen() {
  const { openFeedback, trainingId } = useLocalSearchParams<{
    openFeedback?: string;
    trainingId: string;
  }>();
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const deleteFeedbackMutation = useDeleteTrainingFeedbackMutation();
  const feedbackMutation = useSaveTrainingFeedbackMutation();
  const statusMutation = useUpdateTrainingStatusMutation();
  const { data, error, isLoading } = useTrainingDetailsQuery(trainingId);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [isFeedbackFormVisible, setIsFeedbackFormVisible] = useState(false);
  const canManageFeedback = canCreateFeedbacks(role);
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

  const editingFeedback =
    data.feedbacks.find((feedback) => feedback.id === editingFeedbackId) ?? null;
  const hasScoreData = data.averageFeedbackRating !== null;
  const trainingScore = getOperationalScore(data.averageFeedbackRating);
  const scoreTone = hasScoreData ? getScoreTone(trainingScore) : 'neutral';
  const feedbackCoverageComplete =
    data.feedbackCount > 0 &&
    data.settlements.length > 0 &&
    data.missingFeedbackSettlements.length === 0;
  const metadataSummary = [
    formatDisplayDate(data.training_date),
    formatDisplayTime(data.training_time),
    data.instructor?.full_name || 'ללא מדריך',
    data.location?.trim() || 'ללא מיקום',
  ].join(' • ');
  const averageLabel = data.averageFeedbackRating
    ? data.averageFeedbackRating.toFixed(1)
    : '—';
  const feedbackSummaryText = `${data.missingFeedbackSettlements.length} חסרים | ${data.feedbackCount} משובים | ממוצע ${averageLabel}`;
  const shareMessage = [
    `📍 ${data.title}`,
    `📅 ${formatDisplayDate(data.training_date)}`,
    `🕒 ${formatDisplayTime(data.training_time)}`,
    `📊 ציון: ${trainingScore}`,
    `📌 סטטוס: ${getStatusLabelValue(data.status)}`,
  ].join('\n');

  const executionChecklist = [
    {
      completed: data.training_type === 'מטווח' && data.status === 'הושלם',
      label: 'מטווח',
    },
    {
      completed: data.training_type === 'הגנת יישוב' && data.status === 'הושלם',
      label: 'הגנת יישוב',
    },
    {
      completed: feedbackCoverageComplete,
      label: 'משובים',
    },
  ];

  async function handleShare() {
    try {
      await Share.share({
        message: shareMessage,
        title: data?.title ?? 'אימון',
      });
    } catch {
      Alert.alert('שיתוף לא זמין', 'לא הצלחנו לפתוח את חלונית השיתוף כרגע.');
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <PageHeader
        eyebrow="אימונים"
        title="פרטי אימון"
        subtitle="תמונה מבצעית ממוקדת."
      />

      <AppRevealView delay={20}>
        <AppCard style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <Text numberOfLines={1} style={styles.trainingTitle}>
              {data.title}
            </Text>

            <AppBadge
              label={data.status}
              size="sm"
              tone={getTrainingStatusTone(data.status)}
            />
          </View>

          <Text numberOfLines={1} style={styles.metadataSummary}>
            {metadataSummary}
          </Text>

          {data.notes?.trim() ? (
            <Text numberOfLines={1} style={styles.notesInline}>
              {data.notes.trim()}
            </Text>
          ) : null}
        </AppCard>
      </AppRevealView>

      <AppRevealView delay={40}>
        <View style={styles.quickActionsRow}>
          <ActionButton
            disabled={!canManageFeedback || !profile}
            icon={MessageSquarePlus}
            label="הוסף משוב"
            onPress={() => {
              setEditingFeedbackId(null);
              setIsFeedbackFormVisible(true);
            }}
          />
          <ActionButton
            icon={Share2}
            label="שיתוף"
            onPress={() => {
              void handleShare();
            }}
            tone="primary"
          />
          <ActionButton
            disabled={!canEditTraining}
            icon={SquarePen}
            label="עריכה"
            onPress={() => {
              router.push(`/trainings/${data.id}/edit`);
            }}
          />
        </View>
      </AppRevealView>

      <AppRevealView delay={60}>
        <SectionBlock title="סטטוס ביצוע">
          <AppCard style={styles.statusCard}>
            <View style={styles.checklist}>
              {executionChecklist.map((item) => (
                <StatusChecklistItem
                  key={item.label}
                  completed={item.completed}
                  label={item.label}
                />
              ))}
            </View>
          </AppCard>
        </SectionBlock>
      </AppRevealView>

      <AppRevealView delay={80}>
        <SectionBlock title="ציון אימון">
          <AppCard style={styles.scoreCard}>
            <Text style={[styles.scoreValue, scoreValueStyles[scoreTone]]}>
              {hasScoreData ? trainingScore : '—'}
            </Text>
            <Text style={styles.scoreLabel}>ציון כולל</Text>
            <Text style={styles.scoreHelper}>
              {hasScoreData ? 'מבוסס על משובים שנשמרו' : 'עדיין אין נתוני משוב לחישוב'}
            </Text>
          </AppCard>
        </SectionBlock>
      </AppRevealView>

      <AppRevealView delay={100}>
        <SectionBlock title="משובים">
          <AppCard style={styles.feedbackSummaryCard}>
            <View style={styles.feedbackSummaryTopRow}>
              <Text style={styles.feedbackSummaryText}>{feedbackSummaryText}</Text>

              {canManageFeedback && profile ? (
                <AppButton
                  fullWidth={false}
                  label={
                    isFeedbackFormVisible && !editingFeedbackId
                      ? 'סגור'
                      : 'הוסף משוב'
                  }
                  onPress={() => {
                    if (isFeedbackFormVisible && !editingFeedbackId) {
                      setIsFeedbackFormVisible(false);
                      return;
                    }

                    setEditingFeedbackId(null);
                    setIsFeedbackFormVisible(true);
                  }}
                  style={styles.feedbackInlineButton}
                  variant="secondary"
                />
              ) : null}
            </View>

            {data.missingFeedbackSettlements.length ? (
              <View style={styles.missingFeedbackBlock}>
                <Text style={styles.missingFeedbackTitle}>חסרים משובים עבור</Text>
                <View style={styles.missingFeedbackChips}>
                  {data.missingFeedbackSettlements.map((settlement) => (
                    <CompactChip
                      key={settlement.id}
                      label={settlement.name}
                      tone="warning"
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.completeFeedbackRow}>
                <Check color={theme.colors.accentStrong} size={14} />
                <Text style={styles.completeFeedbackText}>
                  כל היישובים המשתתפים כבר מכוסים במשוב
                </Text>
              </View>
            )}
          </AppCard>

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

          {data.feedbacks.length ? (
            <View style={styles.feedbackList}>
              {data.feedbacks.map((feedback) => (
                <TrainingFeedbackCard
                  key={feedback.id}
                  canDelete={canEditTraining}
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
            <AppCard style={styles.emptyFeedbackCard}>
              <Text style={styles.emptyFeedbackTitle}>אין משובים שמורים</Text>
              <Text style={styles.emptyFeedbackDescription}>
                טרם הוזן משוב עבור האימון הנוכחי.
              </Text>
            </AppCard>
          )}
        </SectionBlock>
      </AppRevealView>

      <AppRevealView delay={120}>
        <SectionBlock title="יישובים משתתפים">
          {data.settlements.length ? (
            <AppCard style={styles.settlementsCard}>
              <View style={styles.settlementBadges}>
                {data.settlements.map((settlement) => (
                  <CompactChip
                    key={settlement.id}
                    label={settlement.name}
                  />
                ))}
              </View>
            </AppCard>
          ) : (
            <StateCard description="עדיין לא שויכו יישובים לאימון זה." title="אין יישובים" />
          )}
        </SectionBlock>
      </AppRevealView>

      {canEditTraining ? (
        <AppRevealView delay={140}>
          <SectionBlock title="פעולה מסכמת">
            {data.status === 'הושלם' ? (
              <AppCard style={styles.footerCard}>
                <View style={styles.completeTrainingRow}>
                  <Check color={theme.colors.accentStrong} size={16} />
                  <Text style={styles.completeTrainingText}>האימון כבר מסומן כהושלם</Text>
                </View>
              </AppCard>
            ) : (
              <AppCard style={styles.footerCard}>
                <AppButton
                  label="השלמת אימון"
                  loading={statusMutation.isPending}
                  onPress={() => {
                    void statusMutation.mutateAsync({
                      status: 'הושלם',
                      trainingId: data.id,
                    });
                  }}
                />
              </AppCard>
            )}
          </SectionBlock>
        </AppRevealView>
      ) : null}
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actionButtonBase: {
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row-reverse',
    gap: 5,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionButtonDisabled: {
    opacity: 0.42,
  },
  actionButtonLabel: {
    ...theme.typography.badge,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionButtonLabelPrimary: {
    color: theme.colors.background,
  },
  actionButtonLabelSecondary: {
    color: theme.colors.textPrimary,
  },
  actionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.988 }],
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.info,
    ...theme.elevation.focus,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
  },
  checklist: {
    gap: 0,
  },
  checklistLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  checklistState: {
    ...theme.typography.badge,
    fontWeight: '700',
    textAlign: 'left',
  },
  checklistStateComplete: {
    color: theme.colors.accentStrong,
  },
  checklistStateMissing: {
    color: theme.colors.danger,
  },
  compactChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  compactChipLabel: {
    ...theme.typography.badge,
    textAlign: 'center',
  },
  compactChipLabelNeutral: {
    color: theme.colors.textSecondary,
  },
  compactChipLabelWarning: {
    color: theme.colors.warning,
  },
  compactChipNeutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  compactChipWarning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
  },
  completeFeedbackRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  completeFeedbackText: {
    color: theme.colors.accentStrong,
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  completeTrainingRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'center',
  },
  completeTrainingText: {
    color: theme.colors.accentStrong,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  feedbackList: {
    gap: theme.spacing.xs,
  },
  feedbackSummaryCard: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feedbackSummaryTopRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
  feedbackSummaryText: {
    color: theme.colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
  },
  footerCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerBadges: {
    alignSelf: 'flex-start',
  },
  headerCard: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'space-between',
  },
  emptyFeedbackCard: {
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyFeedbackDescription: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  emptyFeedbackTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  feedbackInlineButton: {
    minHeight: 34,
    minWidth: 92,
    paddingHorizontal: 12,
  },
  metadataSummary: {
    ...theme.typography.badge,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  missingFeedbackBlock: {
    gap: 5,
  },
  missingFeedbackChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 5,
  },
  missingFeedbackTitle: {
    color: theme.colors.warning,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  notesInline: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
  },
  quickActionsRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  scoreCard: {
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scoreHelper: {
    color: theme.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  scoreLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
    textAlign: 'center',
  },
  screenContent: {
    gap: theme.spacing.section,
  },
  settlementBadges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 5,
  },
  settlementsCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusRow: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingVertical: 6,
  },
  statusStateGroup: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  statusCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trainingTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'right',
  },
}));

const scoreValueStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    color: theme.colors.accentStrong,
  },
  danger: {
    color: theme.colors.danger,
  },
  neutral: {
    color: theme.colors.textMuted,
  },
  warning: {
    color: theme.colors.warning,
  },
}));
