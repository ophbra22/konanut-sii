import { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import type { DashboardUpcomingTraining } from '@/src/features/dashboard/api/dashboard-service';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';

type HeroStatusTone = 'accent' | 'danger' | 'info' | 'neutral' | 'warning';

function getScheduledAt(training: DashboardUpcomingTraining) {
  return training.training_time
    ? dayjs(`${training.training_date}T${training.training_time}`)
    : dayjs(training.training_date).hour(8).minute(0).second(0);
}

function getHeroStatus(
  training: DashboardUpcomingTraining,
  scheduledAt: Dayjs,
  now: Dayjs
): { label: string; tone: HeroStatusTone } {
  if (training.status === 'בוטל') {
    return { label: 'בוטל', tone: 'danger' };
  }

  if (training.status === 'הושלם') {
    return { label: 'הושלם', tone: 'accent' };
  }

  if (scheduledAt.isSame(now, 'day')) {
    return { label: 'היום', tone: 'info' };
  }

  if (scheduledAt.diff(now, 'hour') <= 24) {
    return { label: 'קרוב', tone: 'warning' };
  }

  return { label: training.status, tone: getTrainingStatusTone(training.status) };
}

function getCountdownText(scheduledAt: Dayjs, now: Dayjs) {
  const minutesDiff = scheduledAt.diff(now, 'minute');

  if (minutesDiff <= 0) {
    return 'מתחיל כעת';
  }

  if (minutesDiff < 60) {
    return `מתחיל בעוד ${minutesDiff} דק׳`;
  }

  if (minutesDiff < 24 * 60) {
    const hours = Math.ceil(minutesDiff / 60);
    return `מתחיל בעוד ${hours} שעות`;
  }

  const days = Math.ceil(minutesDiff / (24 * 60));

  if (days === 1) {
    return 'מתחיל בעוד יום';
  }

  return `מתחיל בעוד ${days} ימים`;
}

export function NextTrainingHeroCard({
  training,
}: {
  training: DashboardUpcomingTraining;
}) {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const scheduledAt = useMemo(() => getScheduledAt(training), [training]);
  const heroStatus = useMemo(
    () => getHeroStatus(training, scheduledAt, now),
    [now, scheduledAt, training]
  );
  const countdownText = useMemo(
    () => getCountdownText(scheduledAt, now),
    [now, scheduledAt]
  );
  const settlementsLabel = training.settlements.length
    ? training.settlements.join(' • ')
    : 'ללא שיוך יישובים';
  const locationLabel = training.location?.trim() || 'ללא מיקום';

  return (
    <AppCard style={styles.card}>
      <View pointerEvents="none" style={styles.glowPrimary} />
      <View pointerEvents="none" style={styles.glowSecondary} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppBadge label={heroStatus.label} size="sm" tone={heroStatus.tone} />
          <Text style={styles.eyebrow}>האימון הבא שלך</Text>
        </View>

        <Text numberOfLines={2} style={styles.title}>
          {training.title}
        </Text>

        <Text numberOfLines={1} style={styles.subline}>
          {settlementsLabel} • {locationLabel}
        </Text>

        <View style={styles.timeRow}>
          <View style={styles.metaItem}>
            <CalendarDays color={theme.colors.textMuted} size={13} />
            <Text style={styles.metaText}>{formatDisplayDate(training.training_date)}</Text>
          </View>

          <View style={styles.metaItem}>
            <Clock3 color={theme.colors.textMuted} size={13} />
            <Text style={styles.metaText}>{formatDisplayTime(training.training_time)}</Text>
          </View>
        </View>

        <View style={styles.countdownBand}>
          <Clock3 color={theme.colors.info} size={14} />
          <Text style={styles.countdownText}>{countdownText}</Text>
        </View>

        <AppButton href={`/trainings/${training.id}`} label="מעבר לאימון" />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.info,
    minHeight: 228,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  content: {
    gap: 11,
    position: 'relative',
    zIndex: 1,
  },
  countdownBand: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(108, 143, 255, 0.10)',
    borderColor: 'rgba(108, 143, 255, 0.24)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  countdownText: {
    color: theme.colors.info,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  glowPrimary: {
    backgroundColor: theme.colors.glowMuted,
    borderRadius: 180,
    height: 180,
    opacity: 0.45,
    position: 'absolute',
    right: -42,
    top: -68,
    width: 180,
  },
  glowSecondary: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 140,
    bottom: -76,
    height: 140,
    left: -52,
    opacity: 0.18,
    position: 'absolute',
    width: 140,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  subline: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'right',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31,
    textAlign: 'right',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
});
