import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import type { TrainingFeedbackItem } from '@/src/features/trainings/api/trainings-service';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type TrainingFeedbackCardProps = {
  canDelete?: boolean;
  canEdit?: boolean;
  feedback: TrainingFeedbackItem;
  onDelete?: () => void;
  onEdit?: () => void;
};

export function TrainingFeedbackCard({
  canDelete = false,
  canEdit = false,
  feedback,
  onDelete,
  onEdit,
}: TrainingFeedbackCardProps) {
  const settlementName = feedback.settlement?.name || 'יישוב לא זמין';
  const instructorName = feedback.instructor?.full_name || 'ללא מדריך';

  return (
    <AppCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <AppBadge label={`${feedback.rating}/5`} size="sm" tone="info" />
          {feedback.settlement?.area ? (
            <AppBadge label={feedback.settlement.area} size="sm" tone="neutral" />
          ) : null}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {settlementName}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.metaText}>
          {instructorName}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text numberOfLines={1} style={styles.metaText}>
          {formatDisplayDate(feedback.created_at)}
        </Text>
      </View>

      <Text numberOfLines={3} style={styles.comment}>
        {feedback.comment?.trim() || 'לא נוספה הערת מדריך.'}
      </Text>

      {canEdit || canDelete ? (
        <View style={styles.actions}>
          {canDelete ? (
            <AppButton
              fullWidth={false}
              label="מחיקה"
              onPress={onDelete}
              style={styles.actionButton}
              variant="danger"
            />
          ) : null}
          {canEdit ? (
            <AppButton
              fullWidth={false}
              label="עריכה"
              onPress={onEdit}
              style={styles.actionButton}
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  card: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  comment: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  metaDot: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 5,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '46%',
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'space-between',
  },
}));
