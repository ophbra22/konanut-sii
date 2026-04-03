import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { DataRow } from '@/src/components/ui/data-row';
import type { SettlementListItem } from '@/src/features/settlements/api/settlements-service';
import { theme } from '@/src/theme';

type SettlementListCardProps = {
  footer?: ReactNode;
  settlement: SettlementListItem;
};

function getValue(value: string | null) {
  return value?.trim() ? value : 'לא הוגדר';
}

export function SettlementListCard({
  footer,
  settlement,
}: SettlementListCardProps) {
  return (
    <AppCard
      description={`${settlement.area}${settlement.regional_council ? ` • ${settlement.regional_council}` : ''}`}
      title={settlement.name}
    >
      <View style={styles.meta}>
        <DataRow label="רכז יישובי" value={getValue(settlement.coordinator_name)} />
        <DataRow label="טלפון" value={getValue(settlement.coordinator_phone)} />
      </View>

      <AppBadge
        label={settlement.is_active ? 'יישוב פעיל' : 'יישוב לא פעיל'}
        tone={settlement.is_active ? 'accent' : 'warning'}
      />

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: theme.spacing.xs,
  },
  meta: {
    gap: theme.spacing.sm,
  },
});
