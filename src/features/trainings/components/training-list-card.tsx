import { useRouter } from 'expo-router';
import {
  Clock3,
  MapPinned,
  UserRound,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { OpsListCard } from '@/src/components/ui/ops-list-card';
import type { TrainingListItem } from '@/src/features/trainings/api/trainings-service';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayTime } from '@/src/lib/date-utils';
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
    <OpsListCard
      onPress={() => {
        router.push(`/trainings/${training.id}` as never);
      }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.title}>
          {training.title}
        </Text>

        <AppBadge
          label={training.status}
          size="sm"
          tone={getTrainingStatusTone(training.status)}
        />
      </View>

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
          <UserRound color={theme.colors.textMuted} size={12} />
          <Text numberOfLines={1} style={styles.metaText}>
            {getInstructorLabel(training)}
          </Text>
        </View>
      </View>
    </OpsListCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
  },
  locationItem: {
    flex: 1.3,
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
    color: theme.colors.textSecondary,
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'space-between',
  },
});
