import { Clock3, MapPinned, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import type { CalendarTrainingItem } from '@/src/features/calendar/api/calendar-service';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayTime } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';

type CalendarTrainingCardProps = {
  training: CalendarTrainingItem;
};

function getSettlementsLabel(training: CalendarTrainingItem) {
  if (!training.settlements.length) {
    return 'ללא שיוך יישובים';
  }

  if (training.settlements.length === 1) {
    return training.settlements[0].name;
  }

  return `${training.settlements[0].name} + ${training.settlements.length - 1} נוספים`;
}

export function CalendarTrainingCard({ training }: CalendarTrainingCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        router.push(`/trainings/${training.id}` as never);
      }}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            {training.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock3 color={theme.colors.textMuted} size={14} />
              <Text style={styles.metaText}>{formatDisplayTime(training.training_time)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPinned color={theme.colors.textMuted} size={14} />
              <Text numberOfLines={1} style={styles.metaText}>
                {training.location?.trim() || 'ללא מיקום'}
              </Text>
            </View>
          </View>
        </View>

        <AppBadge label={training.status} tone={getTrainingStatusTone(training.status)} />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <ShieldCheck color={theme.colors.textMuted} size={14} />
          <Text numberOfLines={1} style={styles.footerText}>
            {getSettlementsLabel(training)}
          </Text>
        </View>
        <AppBadge label={training.training_type} tone="neutral" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  footerItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  footerText: {
    color: theme.colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.textSecondary,
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
});
