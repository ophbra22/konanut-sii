import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ListCard } from '@/src/components/ui/list-card';
import type { SettlementRankingListItem } from '@/src/features/rankings/api/rankings-service';
import { rtlRow, rtlRowReverse } from '@/src/lib/rtl';
import { createThemedStyles, type AppTheme } from '@/src/theme';

type SettlementRankingCardProps = {
  ranking: SettlementRankingListItem;
};

function getScoreTone(score: number) {
  if (score >= 90) {
    return 'accent' as const;
  }

  if (score >= 75) {
    return 'teal' as const;
  }

  if (score >= 60) {
    return 'warning' as const;
  }

  return 'danger' as const;
}

function getParticipationLabel(value: number | null) {
  return value === null ? 'אין נתון' : `${value}%`;
}

export function SettlementRankingCard({
  ranking,
}: SettlementRankingCardProps) {
  const router = useRouter();
  const scoreTone = getScoreTone(ranking.finalScore);
  const subtitle = [ranking.councilName?.trim(), ranking.area?.trim()]
    .filter(Boolean)
    .join(' • ');

  return (
    <ListCard
      badge={
        <View style={[styles.scoreBadge, scoreBadgeToneStyles[scoreTone]]}>
          <Text style={[styles.scoreLabel, scoreLabelToneStyles[scoreTone]]}>
            {ranking.finalScore}
          </Text>
        </View>
      }
      footer={
        <View style={styles.footer}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>מועצה</Text>
              <Text numberOfLines={1} style={styles.metricValue}>
                {ranking.councilName?.trim() || 'לא הוגדר'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>מטווח חציוני</Text>
              <Text
                style={[
                  styles.metricValue,
                  ranking.medianRangeParticipationPercent !== null &&
                  ranking.medianRangeParticipationPercent >= 70
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getParticipationLabel(ranking.medianRangeParticipationPercent)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>הגנת יישוב</Text>
              <Text
                style={[
                  styles.metricValue,
                  ranking.settlementDefenseParticipationPercent !== null &&
                  ranking.settlementDefenseParticipationPercent >= 70
                    ? styles.positive
                    : styles.negative,
                ]}
              >
                {getParticipationLabel(ranking.settlementDefenseParticipationPercent)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ציון בסיס</Text>
              <Text style={styles.metricValue}>{ranking.baseScore}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>תוספת משוב מדריך</Text>
              <Text style={styles.metricValue}>{ranking.instructorFeedbackPoints}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ציון סופי</Text>
              <Text style={styles.metricValueStrong}>{ranking.finalScore}</Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.meta}>
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.indicators}>
            <View style={styles.indicator}>
              <Text
                style={[
                  styles.indicatorValue,
                  ranking.shootingCompleted ? styles.positive : styles.negative,
                ]}
              >
                {ranking.shootingCompleted ? '✔' : '✖'}
              </Text>
              <Text style={styles.indicatorLabel}>מטווח</Text>
            </View>

            <View style={styles.indicator}>
              <Text
                style={[
                  styles.indicatorValue,
                  ranking.defenseCompleted ? styles.positive : styles.negative,
                ]}
              >
                {ranking.defenseCompleted ? '✔' : '✖'}
              </Text>
              <Text style={styles.indicatorLabel}>הגנת יישוב</Text>
            </View>
          </View>
        </View>
        </View>
      }
      onPress={() => {
        router.push(`/settlements/${ranking.settlementId}` as never);
      }}
      style={styles.card}
      title={ranking.settlementName}
    />
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  bottomRow: {
    alignItems: 'center',
    ...rtlRow,
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  card: {
    minHeight: 60,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  indicator: {
    alignItems: 'center',
    ...rtlRowReverse,
    gap: 3,
  },
  indicatorLabel: {
    ...theme.typography.badge,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  indicatorValue: {
    ...theme.typography.badge,
    fontWeight: '900',
    textAlign: 'center',
  },
  indicators: {
    alignItems: 'center',
    ...rtlRow,
    flexShrink: 0,
    gap: 8,
    justifyContent: 'flex-end',
  },
  metricItem: {
    gap: 3,
    minWidth: '31%',
  },
  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  metricValue: {
    ...theme.typography.badge,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
  },
  metricValueStrong: {
    ...theme.typography.badge,
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  metricsGrid: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  meta: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    flex: 1,
    paddingStart: theme.spacing.xs,
    textAlign: 'right',
  },
  scoreBadge: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 46,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  scoreLabel: {
    ...theme.typography.badge,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
    textAlign: 'center',
  },
  negative: {
    color: theme.colors.danger,
  },
  positive: {
    color: theme.colors.accentStrong,
  },
}));

const scoreBadgeToneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    backgroundColor: theme.colors.overlay,
    borderColor: theme.colors.accentBorder,
  },
  danger: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
  },
  neutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.accentBorder,
  },
  teal: {
    backgroundColor: theme.colors.surfaceTeal,
    borderColor: theme.colors.tealBorder,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
  },
}));

const scoreLabelToneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    color: theme.colors.accentStrong,
  },
  danger: {
    color: theme.colors.danger,
  },
  info: {
    color: theme.colors.info,
  },
  neutral: {
    color: theme.colors.textSecondary,
  },
  success: {
    color: theme.colors.success,
  },
  teal: {
    color: theme.colors.teal,
  },
  warning: {
    color: theme.colors.warning,
  },
}));
