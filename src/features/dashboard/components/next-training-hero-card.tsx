import { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import type { DashboardUpcomingTraining } from '@/src/features/dashboard/api/dashboard-service';
import { getTrainingStatusTone } from '@/src/features/trainings/lib/training-presenters';
import { formatDisplayDate, formatDisplayTimeRange } from '@/src/lib/date-utils';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

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
    return `בעוד ${minutesDiff} דק׳`;
  }

  if (minutesDiff < 24 * 60) {
    const hours = Math.ceil(minutesDiff / 60);
    return `בעוד ${hours} שעות`;
  }

  const days = Math.ceil(minutesDiff / (24 * 60));

  if (days === 1) {
    return 'בעוד יום';
  }

  return `בעוד ${days} ימים`;
}

function formatStableTimeRange(startTime: string | null, endTime?: string | null) {
  return `\u200E${formatDisplayTimeRange(startTime, endTime)}\u200E`;
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
      <View pointerEvents="none" style={styles.topWash} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>האימון הבא</Text>
          <AppBadge label={heroStatus.label} size="sm" tone={heroStatus.tone} />
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
            <Text style={styles.metaText}>
              {formatStableTimeRange(training.training_time, training.end_time)}
            </Text>
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

const styles = createThemedStyles((theme: AppTheme) => ({
  card: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.cardOutline,
    borderRadius: 16,
    borderWidth: 1,
    direction: 'ltr',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  content: {
    alignItems: 'stretch',
    gap: 10,
    position: 'relative',
    zIndex: 1,
  },
  ctaButton: {
    marginTop: 2,
  },
  countdownBand: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 14,
    direction: 'ltr',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  countdownText: {
    color: theme.colors.info,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  eyebrow: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaItem: {
    alignItems: 'center',
    direction: 'ltr',
    flexDirection: 'row-reverse',
    gap: 4,
  },
  metaText: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  subline: {
    ...theme.typography.meta,
    color: theme.colors.textDim,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timeRow: {
    direction: 'ltr',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  topWash: {
    backgroundColor: theme.colors.mediaGlow,
    borderRadius: 999,
    height: 120,
    opacity: 0.8,
    position: 'absolute',
    end: -34,
    top: -48,
    width: 120,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 25,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  topRow: {
    alignItems: 'center',
    direction: 'ltr',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
}));
