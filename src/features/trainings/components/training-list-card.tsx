import { useRouter } from 'expo-router';
import {
  CalendarDays,
  Clock3,
  MapPinned,
  UserRound,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { ListCard } from '@/src/components/ui/list-card';
import type { TrainingListItem } from '@/src/features/trainings/api/trainings-service';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';

type TrainingListCardProps = {
  training: TrainingListItem;
};

function getLocationLabel(training: TrainingListItem) {
  return training.location?.trim() || 'ללא מיקום';
}

function getInstructorLabel(training: TrainingListItem) {
  return training.instructor?.full_name || 'ללא מדריך';
}

export function TrainingListCard({ training }: TrainingListCardProps) {
  const router = useRouter();

  return (
    <ListCard
      badge={
        <AppBadge
          label={training.status}
          size="sm"
          tone={getTrainingStatusTone(training.status)}
        />
      }
      footer={
        <View style={styles.metaRow}>
          <View style={[styles.metaItem, styles.locationItem]}>
            <MapPinned color={theme.colors.textMuted} size={12} />
            <Text numberOfLines={1} style={styles.metaText}>
              {getLocationLabel(training)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Clock3 color={theme.colors.textMuted} size={12} />
            <Text numberOfLines={1} style={styles.metaText}>
              {formatDisplayTime(training.training_time)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <CalendarDays color={theme.colors.textMuted} size={12} />
            <Text numberOfLines={1} style={styles.metaText}>
              {formatDisplayDate(training.training_date)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <UserRound color={theme.colors.textMuted} size={12} />
            <Text numberOfLines={1} style={styles.metaText}>
              {getInstructorLabel(training)}
            </Text>
          </View>
        </View>
      }
      onPress={() => {
        router.push(`/trainings/${training.id}` as never);
      }}
      style={styles.card}
      title={training.title}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 62,
  },
  locationItem: {
    flex: 1.2,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row-reverse',
    gap: 4,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  metaText: {
    ...theme.typography.badge,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
});
