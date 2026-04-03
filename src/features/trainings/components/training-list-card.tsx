import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import type { TrainingListItem } from '@/src/features/trainings/api/trainings-service';
import { theme } from '@/src/theme';

type TrainingListCardProps = {
  training: TrainingListItem;
};

function getStatusTone(status: TrainingListItem['status']) {
  switch (status) {
    case 'בוטל':
      return 'danger';
    case 'נדחה':
      return 'warning';
    case 'הושלם':
      return 'accent';
    default:
      return 'neutral';
  }
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : 'ללא שעה';
}

function getSettlementsLabel(training: TrainingListItem) {
  if (!training.settlements.length) {
    return 'לא שויכו יישובים';
  }

  return training.settlements.map((settlement) => settlement.name).join(', ');
}

export function TrainingListCard({ training }: TrainingListCardProps) {
  return (
    <AppCard
      description={`${dayjs(training.training_date).format('DD/MM/YYYY')} • ${formatTime(
        training.training_time
      )}`}
      title={training.title}
    >
      <View style={styles.badges}>
        <AppBadge label={training.training_type} tone="accent" />
        <AppBadge label={training.status} tone={getStatusTone(training.status)} />
      </View>

      <View style={styles.meta}>
        <View style={styles.row}>
          <Text style={styles.label}>מיקום</Text>
          <Text style={styles.value}>{training.location?.trim() || 'לא הוגדר'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>מדריך</Text>
          <Text style={styles.value}>
            {training.instructor?.full_name || 'טרם שובץ'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>יישובים</Text>
          <Text style={styles.value}>{getSettlementsLabel(training)}</Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  meta: {
    gap: theme.spacing.sm,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  value: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'left',
  },
});
