import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OpsListCard } from '@/src/components/ui/ops-list-card';
import type { SettlementListItem } from '@/src/features/settlements/api/settlements-service';
import { theme } from '@/src/theme';

type SettlementListCardProps = {
  settlement: SettlementListItem;
};

type ReadinessTone = 'danger' | 'neutral' | 'success' | 'warning';

function getMetaLabel(settlement: SettlementListItem) {
  const parts = [settlement.regional_council?.trim(), settlement.area.trim()].filter(Boolean);
  return parts.join(' • ');
}

function getReadinessTone(score: number | null): ReadinessTone {
  if (score === null) {
    return 'neutral';
  }

  if (score >= 80) {
    return 'success';
  }

  if (score >= 60) {
    return 'warning';
  }

  return 'danger';
}

function getReadinessLabel(score: number | null) {
  if (score === null) {
    return '—';
  }

  return `${score}%`;
}

export function SettlementListCard({ settlement }: SettlementListCardProps) {
  const router = useRouter();
  const tone = getReadinessTone(settlement.readinessScore);

  return (
    <OpsListCard
      onPress={() => {
        router.push(`/settlements/${settlement.id}` as never);
      }}
      style={[
        styles.card,
        !settlement.is_active && styles.cardInactive,
      ]}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.title}>
          {settlement.name || 'יישוב ללא שם'}
        </Text>

        <View style={styles.scoreBlock}>
          <View style={[styles.scoreBadge, scoreBadgeStyles[tone]]}>
            <Text style={[styles.scoreLabel, scoreLabelStyles[tone]]}>
              {getReadinessLabel(settlement.readinessScore)}
            </Text>
          </View>
          <View style={[styles.scoreDot, scoreDotStyles[tone]]} />
        </View>
      </View>

      <Text numberOfLines={1} style={styles.meta}>
        {getMetaLabel(settlement) || 'מועצה ואזור לא הוגדרו'}
      </Text>
    </OpsListCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 66,
  },
  cardInactive: {
    opacity: 0.72,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'right',
  },
  scoreBadge: {
    alignItems: 'center',
    borderRadius: 999,
    minWidth: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreBlock: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 5,
  },
  scoreDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
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

const scoreBadgeStyles = StyleSheet.create({
  danger: {
    backgroundColor: 'rgba(255, 114, 87, 0.14)',
  },
  neutral: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  success: {
    backgroundColor: theme.colors.overlay,
  },
  warning: {
    backgroundColor: 'rgba(245, 178, 75, 0.16)',
  },
});

const scoreDotStyles = StyleSheet.create({
  danger: {
    backgroundColor: theme.colors.danger,
  },
  neutral: {
    backgroundColor: theme.colors.textMuted,
  },
  success: {
    backgroundColor: theme.colors.accentStrong,
  },
  warning: {
    backgroundColor: theme.colors.warning,
  },
});

const scoreLabelStyles = StyleSheet.create({
  danger: {
    color: theme.colors.danger,
  },
  neutral: {
    color: theme.colors.textSecondary,
  },
  success: {
    color: theme.colors.accentStrong,
  },
  warning: {
    color: theme.colors.warning,
  },
});
