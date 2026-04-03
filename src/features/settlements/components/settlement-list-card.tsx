import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import type { SettlementListItem } from '@/src/features/settlements/api/settlements-service';
import { theme } from '@/src/theme';

type SettlementListCardProps = {
  settlement: SettlementListItem;
};

function getValue(value: string | null) {
  return value?.trim() ? value : 'לא הוגדר';
}

export function SettlementListCard({ settlement }: SettlementListCardProps) {
  return (
    <AppCard
      description={`${settlement.area}${settlement.regional_council ? ` • ${settlement.regional_council}` : ''}`}
      title={settlement.name}
    >
      <View style={styles.meta}>
        <View style={styles.row}>
          <Text style={styles.label}>רכז יישובי</Text>
          <Text style={styles.value}>{getValue(settlement.coordinator_name)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>טלפון</Text>
          <Text style={styles.value}>{getValue(settlement.coordinator_phone)}</Text>
        </View>
      </View>

      <AppBadge
        label={settlement.is_active ? 'יישוב פעיל' : 'יישוב לא פעיל'}
        tone={settlement.is_active ? 'accent' : 'warning'}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  meta: {
    gap: theme.spacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  value: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    textAlign: 'left',
  },
});
