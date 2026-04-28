import { Text, View } from 'react-native';

import { SettlementPicker } from '@/src/components/ui/settlement-picker';
import { rtlRow } from '@/src/lib/rtl';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';
import type { LinkedSettlement } from '@/src/types/database';

type UserSettlementAssignmentFieldProps = {
  errorMessage?: string;
  helperText?: string;
  onToggleSettlement: (settlementId: string) => void;
  selectedSettlementIds: string[];
  settlements: LinkedSettlement[];
};

export function UserSettlementAssignmentField({
  errorMessage,
  helperText,
  onToggleSettlement,
  selectedSettlementIds,
  settlements,
}: UserSettlementAssignmentFieldProps) {
  const selectedCount = selectedSettlementIds.length;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>שיוך יישובים</Text>
        <Text style={styles.meta}>{selectedCount} נבחרו</Text>
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <SettlementPicker
        errorMessage={errorMessage}
        multiple
        onChange={(nextSettlementIds) => {
          const nextIdSet = new Set(nextSettlementIds);
          const currentIdSet = new Set(selectedSettlementIds);
          const changedIds = new Set([...selectedSettlementIds, ...nextSettlementIds]);

          changedIds.forEach((settlementId) => {
            if (currentIdSet.has(settlementId) !== nextIdSet.has(settlementId)) {
              onToggleSettlement(settlementId);
            }
          });
        }}
        placeholder="בחר יישובים"
        selectedSettlementIds={selectedSettlementIds}
        settlements={settlements}
      />
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  header: {
    alignItems: 'center',
    ...rtlRow,
    justifyContent: 'space-between',
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  meta: {
    ...theme.typography.badge,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  section: {
    gap: theme.spacing.xs,
  },
}));
