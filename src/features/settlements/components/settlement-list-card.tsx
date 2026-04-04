import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { ListCard } from '@/src/components/ui/list-card';
import type { SettlementListItem } from '@/src/features/settlements/api/settlements-service';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

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

function ComplianceIndicator({
  completed,
  label,
}: {
  completed: boolean;
  label: string;
}) {
  return (
    <View style={styles.complianceItem}>
      <View
        style={[
          styles.complianceDot,
          completed ? styles.complianceDotSuccess : styles.complianceDotMissing,
        ]}
      />
      <Text
        style={[
          styles.complianceText,
          completed ? styles.complianceTextSuccess : styles.complianceTextMissing,
        ]}
      >
        {label}: {completed ? 'בוצע' : 'חסר'}
      </Text>
    </View>
  );
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
      footer={
        <View style={styles.complianceRow}>
          <ComplianceIndicator
            completed={settlement.shootingCompletedCurrentHalfYear}
            label="מטווח"
          />
          <ComplianceIndicator
            completed={settlement.defenseCompletedCurrentYear}
            label="הגנת יישוב"
          />
        </View>
      }
      title={settlement.name || 'יישוב ללא שם'}
    />
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  card: {
    minHeight: 82,
  },
  cardInactive: {
    opacity: 0.72,
  },
  complianceDot: {
    borderRadius: theme.radius.pill,
    height: 7,
    width: 7,
  },
  complianceDotMissing: {
    backgroundColor: theme.colors.danger,
  },
  complianceDotSuccess: {
    backgroundColor: theme.colors.success,
  },
  complianceItem: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 5,
  },
  complianceRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xxs,
  },
  complianceText: {
    ...theme.typography.badge,
    textAlign: 'right',
  },
  complianceTextMissing: {
    color: theme.colors.danger,
  },
  complianceTextSuccess: {
    color: theme.colors.success,
  },
}));
