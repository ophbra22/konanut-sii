import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { OpsListCard } from '@/src/components/ui/ops-list-card';
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

  return (
    <OpsListCard
      onPress={() => {
        router.push(`/settlements/${ranking.settlementId}` as never);
      }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.title}>
          {ranking.settlementName}
        </Text>

        <AppBadge
          label={`${ranking.finalScore}`}
          size="sm"
          tone={getScoreTone(ranking.finalScore)}
        />
      </View>

      <View style={styles.bottomRow}>
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
    </OpsListCard>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  card: {
    gap: 8,
  },
  indicator: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
  },
  indicatorLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  indicatorValue: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  indicators: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
    justifyContent: 'flex-end',
  },
  negative: {
    color: theme.colors.danger,
  },
  positive: {
    color: theme.colors.accentStrong,
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
});
