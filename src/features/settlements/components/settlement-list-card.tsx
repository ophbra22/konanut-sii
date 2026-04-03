import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { ListCard } from '@/src/components/ui/list-card';
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
  const badgeTone = tone === 'success' ? 'accent' : tone;
  const dotColor =
    tone === 'success'
      ? theme.colors.accentStrong
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger'
          ? theme.colors.danger
          : theme.colors.textMuted;

  return (
    <ListCard
      badge={
        <AppBadge
          label={getReadinessLabel(settlement.readinessScore)}
          size="sm"
          tone={badgeTone}
        />
      }
      onPress={() => {
        router.push(`/settlements/${settlement.id}` as never);
      }}
      style={[
        styles.card,
        !settlement.is_active && styles.cardInactive,
      ]}
      statusDotColor={dotColor}
      subtitle={getMetaLabel(settlement) || 'מועצה ואזור לא הוגדרו'}
      title={settlement.name || 'יישוב ללא שם'}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 62,
  },
  cardInactive: {
    opacity: 0.72,
  },
});
