import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { DataRow } from '@/src/components/ui/data-row';
import type { TrainingListItem } from '@/src/features/trainings/api/trainings-service';
import { theme } from '@/src/theme';

type TrainingListCardProps = {
  footer?: ReactNode;
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

export function TrainingListCard({
  footer,
  training,
}: TrainingListCardProps) {
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
        <DataRow label="מיקום" value={training.location?.trim() || 'לא הוגדר'} />
        <DataRow label="מדריך" value={training.instructor?.full_name || 'טרם שובץ'} />
        <DataRow label="יישובים" value={getSettlementsLabel(training)} />
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xs,
  },
  meta: {
    gap: theme.spacing.sm,
  },
});
