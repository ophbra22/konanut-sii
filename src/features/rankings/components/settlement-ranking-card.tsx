import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { ListCard } from '@/src/components/ui/list-card';
import type { SettlementRankingListItem } from '@/src/features/rankings/api/rankings-service';
import { theme } from '@/src/theme';

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

export function SettlementRankingCard({
  ranking,
}: SettlementRankingCardProps) {
  const router = useRouter();
  const subtitle = [ranking.regionalCouncil?.trim(), ranking.area?.trim()]
    .filter(Boolean)
    .join(' • ');

  return (
    <ListCard
      badge={
        <AppBadge
          label={`${ranking.finalScore}`}
          size="sm"
          tone={getScoreTone(ranking.finalScore)}
        />
      }
      footer={
        <View style={styles.bottomRow}>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.meta}>
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.indicators}>
            <View style={styles.indicator}>
              <Text style={styles.indicatorLabel}>מטווח</Text>
              <Text
                style={[
                  styles.indicatorValue,
                  ranking.shootingCompleted ? styles.positive : styles.negative,
                ]}
              >
                {ranking.shootingCompleted ? '✔' : '✖'}
              </Text>
            </View>

            <View style={styles.indicator}>
              <Text style={styles.indicatorLabel}>הגנת יישוב</Text>
              <Text
                style={[
                  styles.indicatorValue,
                  ranking.defenseCompleted ? styles.positive : styles.negative,
                ]}
              >
                {ranking.defenseCompleted ? '✔' : '✖'}
              </Text>
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

const styles = StyleSheet.create({
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  card: {
    minHeight: 64,
  },
  indicator: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
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
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'flex-end',
  },
  meta: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  negative: {
    color: theme.colors.danger,
  },
  positive: {
    color: theme.colors.accentStrong,
  },
});
