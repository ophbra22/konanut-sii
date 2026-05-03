import type { ComponentType, ReactNode } from 'react';
import type { DimensionValue } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  MessageSquare,
  Share2,
  SquarePen,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react-native';

import type {
  TrainingDetails,
  TrainingFeedbackItem,
} from '@/src/features/trainings/api/trainings-service';
import {
  getAttendanceStatus,
  getReadinessLabel,
  getScoreColor,
  getTrainingStatus,
  getTrainingStatusColor,
  summaryColors,
} from '@/src/features/trainings/lib/training-summary-helpers';
import { formatDisplayDate, formatDisplayTimeRange } from '@/src/lib/date-utils';
import { rtlRow, rtlRowReverse } from '@/src/lib/rtl';

type IconComponent = ComponentType<{ color: string; size: number }>;
type SummaryActionTone = 'danger' | 'primary' | 'secondary';

type StatusBadgeProps = {
  label: string;
};

type HeroCardProps = {
  score: number;
  training: TrainingDetails;
};

type SnapshotCardProps = {
  feedback: TrainingFeedbackItem | null;
  training: TrainingDetails;
};

type ScoreBreakdownCardProps = {
  score: number;
};

type AttendanceCardProps = {
  canEdit: boolean;
  onAddData: () => void;
  training: TrainingDetails;
};

type FeedbackCardProps = {
  canDelete: boolean;
  canEdit: boolean;
  feedback: TrainingFeedbackItem | null;
  isFormVisible: boolean;
  onAdd: () => void;
  onDelete: () => void;
  onEdit: () => void;
  training: TrainingDetails;
};

type ActionsCardProps = {
  canDelete: boolean;
  canEdit: boolean;
  canMarkComplete: boolean;
  isAddingToCalendar: boolean;
  isCompleting: boolean;
  isDeleting: boolean;
  onAddToCalendar: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMarkComplete: () => void;
  onShareSummary: () => void;
};

type ActionButtonProps = {
  disabled?: boolean;
  icon: IconComponent;
  label: string;
  loading?: boolean;
  onPress: () => void;
  tone?: SummaryActionTone;
};

function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function StatusBadge({ label }: StatusBadgeProps) {
  const color = getTrainingStatusColor(label as ReturnType<typeof getTrainingStatus>);

  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}1F`, borderColor: color }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ color, value }: { color: string; value: number }) {
  const width = `${Math.max(0, Math.min(value, 100))}%` as DimensionValue;

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { backgroundColor: color, width }]} />
    </View>
  );
}

export function HeroCard({ score, training }: HeroCardProps) {
  const settlements = training.settlements.map((settlement) => settlement.name).join(', ');
  const subtitle = [
    training.instructor?.full_name || 'ללא מדריך',
    settlements || 'ללא יישובים',
    formatDisplayDate(training.training_date),
    formatDisplayTimeRange(training.training_time, training.end_time),
  ].join(' | ');
  const scoreColor = getScoreColor(score);
  const status = getTrainingStatus(training);

  return (
    <Card style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <StatusBadge label={status} />
        <View style={styles.heroTitleBlock}>
          <Text style={styles.heroTitle}>{training.title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.scoreBlock}>
        <Text style={[styles.heroScore, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.scoreLabel}>מדד מוכנות</Text>
        <Text style={[styles.scoreReadiness, { color: scoreColor }]}>
          {getReadinessLabel(score)}
        </Text>
      </View>
    </Card>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  status,
  tone,
}: {
  icon: IconComponent;
  label: string;
  status: string;
  tone: string;
}) {
  return (
    <View style={styles.snapshotRow}>
      <Text style={[styles.snapshotStatus, { color: tone }]}>{status}</Text>
      <View style={styles.snapshotLabelGroup}>
        <Text style={styles.snapshotLabel}>{label}</Text>
        <Icon color={tone} size={20} />
      </View>
    </View>
  );
}

export function SnapshotCard({ feedback, training }: SnapshotCardProps) {
  const trainingStatus = getTrainingStatus(training);
  const attendanceStatus = getAttendanceStatus(training);
  const feedbackStatus = feedback ? 'הוזן' : 'חסר';

  return (
    <Card>
      <SectionTitle>תמונת מצב</SectionTitle>
      <View style={styles.snapshotRows}>
        <SnapshotRow
          icon={ClipboardCheck}
          label="אימון"
          status={trainingStatus}
          tone={getTrainingStatusColor(trainingStatus)}
        />
        <SnapshotRow
          icon={Users}
          label="השתתפות"
          status={attendanceStatus}
          tone={attendanceStatus === 'עומד ביעד' ? summaryColors.green : summaryColors.orange}
        />
        <SnapshotRow
          icon={MessageSquare}
          label="משוב מדריך"
          status={feedbackStatus}
          tone={feedback ? summaryColors.green : summaryColors.red}
        />
      </View>
    </Card>
  );
}

export function ScoreBreakdownCard({ score }: ScoreBreakdownCardProps) {
  const scoreColor = getScoreColor(score);
  const pointsToTarget = Math.max(0, 70 - score);

  return (
    <Card>
      <SectionTitle>פירוק ציון</SectionTitle>
      <View style={styles.scoreBreakdownTop}>
        <Text style={[styles.breakdownValue, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.breakdownLabel}>ציון סופי</Text>
      </View>
      <ProgressBar color={scoreColor} value={score} />
      {score < 70 ? (
        <Text style={styles.targetGap}>חסר {pointsToTarget} נקודות לעמידה ביעד 70</Text>
      ) : (
        <Text style={styles.targetMet}>עומד ביעד 70</Text>
      )}
    </Card>
  );
}

export function AttendanceCard({ canEdit, onAddData, training }: AttendanceCardProps) {
  const summary = training.participationSummary;
  const rate = summary.overall_participation_rate;
  const hasAttendance = training.settlement_attendance.length > 0;
  const attendanceStatus = getAttendanceStatus(training);
  const tone = attendanceStatus === 'עומד ביעד' ? summaryColors.green : summaryColors.orange;

  return (
    <Card>
      <SectionTitle>משתתפים</SectionTitle>
      {hasAttendance ? (
        <View style={styles.attendanceContent}>
          <View style={styles.attendanceTopRow}>
            <View style={[styles.attendanceStatusPill, { borderColor: tone }]}>
              <Text style={[styles.attendanceStatusText, { color: tone }]}>
                {attendanceStatus}
              </Text>
            </View>
            <View>
              <Text style={styles.attendanceMain}>
                {summary.total_trained_overall} מתוך {summary.total_squad_overall || 'לא הוגדר'}
              </Text>
              <Text style={styles.attendanceSub}>יעד 70%</Text>
            </View>
          </View>
          <Text style={[styles.attendancePercent, { color: tone }]}>
            {rate === null ? 'אין מספיק נתונים' : `${rate}%`}
          </Text>
          <ProgressBar color={tone} value={rate ?? 0} />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <TriangleAlert color={summaryColors.orange} size={24} />
          <Text style={styles.emptyTitle}>לא הוזנו נתוני השתתפות</Text>
          <Text style={styles.emptyText}>נתוני המשתתפים נשמרים בעריכת האימון.</Text>
          {canEdit ? (
            <SummaryActionButton
              icon={SquarePen}
              label="הוסף נתונים"
              onPress={onAddData}
              tone="primary"
            />
          ) : null}
        </View>
      )}
    </Card>
  );
}

export function FeedbackCard({
  canDelete,
  canEdit,
  feedback,
  isFormVisible,
  onAdd,
  onDelete,
  onEdit,
  training,
}: FeedbackCardProps) {
  const hasMultipleSettlements = training.settlements.length > 1;

  return (
    <Card>
      <View style={styles.cardTitleRow}>
        {canEdit || (canDelete && feedback) ? (
          <View style={styles.feedbackActions}>
            {canDelete && feedback ? (
              <SummaryActionButton
                icon={Trash2}
                label="מחק"
                onPress={onDelete}
                tone="danger"
              />
            ) : null}
            {canEdit ? (
              <SummaryActionButton
                icon={feedback ? SquarePen : MessageSquare}
                label={feedback ? 'ערוך' : 'הוסף משוב'}
                onPress={feedback ? onEdit : onAdd}
                tone="secondary"
              />
            ) : null}
          </View>
        ) : null}
        <View style={styles.titleTextBlock}>
          <SectionTitle>משוב מדריך</SectionTitle>
          <Text style={styles.sectionSubtitle}>משוב על האימון (משותף לכלל היישובים)</Text>
        </View>
      </View>

      {hasMultipleSettlements ? (
        <Text style={styles.feedbackScope}>
          המשוב מתייחס לכלל היישובים שהשתתפו באימון
        </Text>
      ) : null}

      {feedback ? (
        <View style={styles.feedbackBody}>
          <View style={styles.ratingRow}>
            <Text style={styles.feedbackRating}>{feedback.rating}/5</Text>
            <Text style={styles.ratingLabel}>דירוג</Text>
          </View>
          <Text style={styles.feedbackText}>
            {feedback.comment?.trim() || 'לא נוספה הערת מדריך.'}
          </Text>
          <Text style={styles.feedbackAuthor}>
            {feedback.instructor?.full_name ? `נכתב על ידי ${feedback.instructor.full_name}` : 'מחבר לא זמין'}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MessageSquare color={summaryColors.primary} size={24} />
          <Text style={styles.emptyTitle}>עדיין לא הוזן משוב מדריך</Text>
          {canEdit && !isFormVisible ? (
            <SummaryActionButton
              icon={MessageSquare}
              label="הוסף משוב"
              onPress={onAdd}
              tone="primary"
            />
          ) : null}
        </View>
      )}
    </Card>
  );
}

export function ActionsCard({
  canDelete,
  canEdit,
  canMarkComplete,
  isAddingToCalendar,
  isCompleting,
  isDeleting,
  onAddToCalendar,
  onDelete,
  onEdit,
  onMarkComplete,
  onShareSummary,
}: ActionsCardProps) {
  return (
    <Card>
      <SectionTitle>פעולות</SectionTitle>
      <View style={styles.actionsGrid}>
        {canEdit ? (
          <SummaryActionButton icon={SquarePen} label="עריכת אימון" onPress={onEdit} />
        ) : null}
        <SummaryActionButton icon={Share2} label="שיתוף סיכום" onPress={onShareSummary} />
        <SummaryActionButton
          icon={CalendarPlus}
          label={isAddingToCalendar ? 'מוסיף ליומן...' : 'הוסף ליומן'}
          loading={isAddingToCalendar}
          onPress={onAddToCalendar}
        />
        {canMarkComplete ? (
          <SummaryActionButton
            icon={CheckCircle2}
            label="השלמת אימון"
            loading={isCompleting}
            onPress={onMarkComplete}
            tone="primary"
          />
        ) : null}
        {canDelete ? (
          <SummaryActionButton
            icon={Trash2}
            label="מחיקת אימון"
            loading={isDeleting}
            onPress={onDelete}
            tone="danger"
          />
        ) : null}
      </View>
    </Card>
  );
}

function SummaryActionButton({
  disabled = false,
  icon: Icon,
  label,
  loading = false,
  onPress,
  tone = 'secondary',
}: ActionButtonProps) {
  const isDisabled = disabled || loading;
  const colors = {
    danger: {
      backgroundColor: summaryColors.red,
      borderColor: summaryColors.red,
      color: '#FFFFFF',
    },
    primary: {
      backgroundColor: summaryColors.primary,
      borderColor: summaryColors.primary,
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#FFFFFF',
      borderColor: summaryColors.border,
      color: summaryColors.text,
    },
  }[tone];

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryActionButton,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <Icon color={colors.color} size={18} />
      <Text numberOfLines={1} style={[styles.summaryActionText, { color: colors.color }]}>
        {loading ? 'טוען...' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionsGrid: {
    gap: 10,
  },
  attendanceContent: {
    gap: 12,
  },
  attendanceMain: {
    color: summaryColors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  attendancePercent: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
    textAlign: 'right',
  },
  attendanceStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  attendanceStatusText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  attendanceSub: {
    color: summaryColors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  attendanceTopRow: {
    alignItems: 'center',
    ...rtlRow,
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: summaryColors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  breakdownValue: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  card: {
    backgroundColor: summaryColors.card,
    borderColor: summaryColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    ...rtlRow,
    gap: 12,
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.56,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  emptyText: {
    color: summaryColors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyTitle: {
    color: summaryColors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  feedbackAuthor: {
    color: summaryColors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  feedbackBody: {
    gap: 12,
  },
  feedbackActions: {
    gap: 8,
    minWidth: 92,
  },
  feedbackRating: {
    color: summaryColors.primary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  feedbackScope: {
    color: summaryColors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  feedbackText: {
    color: summaryColors.text,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroCard: {
    gap: 20,
  },
  heroScore: {
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 76,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: summaryColors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroTitle: {
    color: summaryColors.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 35,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroTitleBlock: {
    flex: 1,
    gap: 6,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    ...rtlRow,
    gap: 12,
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: '#E8EEF4',
    borderRadius: 999,
    height: 12,
    overflow: 'hidden',
    width: '100%',
  },
  ratingLabel: {
    color: summaryColors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
  },
  ratingRow: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    ...rtlRow,
    gap: 8,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: 4,
  },
  scoreBreakdownTop: {
    alignItems: 'center',
    ...rtlRow,
    gap: 10,
    justifyContent: 'flex-start',
  },
  scoreLabel: {
    color: summaryColors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  scoreReadiness: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    color: summaryColors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    color: summaryColors.text,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  snapshotLabel: {
    color: summaryColors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  snapshotLabelGroup: {
    alignItems: 'center',
    ...rtlRow,
    gap: 8,
  },
  snapshotRow: {
    alignItems: 'center',
    borderBottomColor: '#EDF2F6',
    borderBottomWidth: 1,
    ...rtlRow,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  snapshotRows: {
    gap: 2,
  },
  snapshotStatus: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  summaryActionButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    ...rtlRowReverse,
    gap: 8,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  summaryActionText: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  targetGap: {
    color: summaryColors.orange,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  targetMet: {
    color: summaryColors.green,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleTextBlock: {
    flex: 1,
    gap: 3,
  },
});
