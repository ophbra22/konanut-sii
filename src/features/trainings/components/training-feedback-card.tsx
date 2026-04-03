import { StyleSheet, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { DataRow } from '@/src/components/ui/data-row';
import type { TrainingFeedbackItem } from '@/src/features/trainings/api/trainings-service';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';

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
  return (
    <AppCard
      description={feedback.comment?.trim() || 'לא נמסרה הערת מדריך חופשית.'}
      style={styles.card}
      title={feedback.settlement?.name || 'יישוב לא זמין'}
    >
      <View style={styles.badges}>
        <AppBadge label={`דירוג ${feedback.rating}/5`} size="sm" tone="accent" />
        {feedback.settlement?.area ? (
          <AppBadge label={feedback.settlement.area} size="sm" tone="neutral" />
        ) : null}
      </View>

      <View style={styles.meta}>
        <DataRow label="מדריך" value={feedback.instructor?.full_name || 'לא הוגדר'} />
        <DataRow label="תאריך יצירה" value={formatDisplayDate(feedback.created_at)} />
      </View>

      {canEdit || canDelete ? (
        <View style={styles.actions}>
          {canEdit ? (
            <AppButton
              fullWidth={false}
              label="עריכת משוב"
              onPress={onEdit}
              style={styles.actionButton}
              variant="secondary"
            />
          ) : null}
          {canDelete ? (
            <AppButton
              fullWidth={false}
              label="מחיקה"
              onPress={onDelete}
              style={styles.actionButton}
              variant="danger"
            />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  meta: {
    gap: 8,
  },
});
