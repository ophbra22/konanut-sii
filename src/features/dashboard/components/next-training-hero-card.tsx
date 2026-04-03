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
    return '⏳ מתחיל כעת';
  }

  if (minutesDiff < 60) {
    return `⏳ בעוד ${minutesDiff} דק׳`;
  }

  if (minutesDiff < 24 * 60) {
    const hours = Math.ceil(minutesDiff / 60);
    return `⏳ בעוד ${hours} שעות`;
  }

  const days = Math.ceil(minutesDiff / (24 * 60));

  if (days === 1) {
    return '⏳ בעוד יום';
  }

  return `⏳ בעוד ${days} ימים`;
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
      <View pointerEvents="none" style={styles.edgeGlow} />

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
          <Text numberOfLines={1} style={styles.countdownText}>
            {countdownText}
          </Text>
        </View>

        <AppButton
          href={`/trainings/${training.id}`}
          label="מעבר לאימון"
          size="sm"
          style={styles.ctaButton}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.info,
    minHeight: 188,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    position: 'relative',
    ...theme.elevation.hero,
  },
  content: {
    gap: theme.spacing.xs,
    position: 'relative',
    zIndex: 1,
  },
  ctaButton: {
    marginTop: theme.spacing.xxs,
  },
  countdownBand: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(108, 143, 255, 0.14)',
    borderColor: 'rgba(108, 143, 255, 0.30)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
  },
  countdownText: {
    color: theme.colors.info,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  edgeGlow: {
    backgroundColor: 'rgba(108, 143, 255, 0.08)',
    borderRadius: 999,
    height: 112,
    opacity: 0.85,
    position: 'absolute',
    right: -36,
    top: 48,
    width: 112,
  },
  eyebrow: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
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
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  subline: {
    ...theme.typography.meta,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 29,
    textAlign: 'right',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
});
