import { StyleSheet, Text, View } from 'react-native';

import { AppChip } from '@/src/components/ui/app-chip';
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

      <View style={styles.chips}>
        {settlements.map((settlement) => {
          const isSelected = selectedSettlementIds.includes(settlement.id);

          return (
            <AppChip
              key={settlement.id}
              label={settlement.name}
              onPress={() => {
                onToggleSettlement(settlement.id);
              }}
              selected={isSelected}
              tone={isSelected ? 'accent' : 'neutral'}
            />
          );
        })}
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    textAlign: 'right',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
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
    textAlign: 'left',
  },
  section: {
    gap: theme.spacing.xs,
  },
}));
