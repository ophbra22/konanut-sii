import { StyleSheet, Text, View } from 'react-native';

import { AppChip } from '@/src/components/ui/app-chip';
import { rtlRow } from '@/src/lib/rtl';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type UserRegionalCouncilAssignmentFieldProps = {
  errorMessage?: string;
  helperText?: string;
  onToggleRegionalCouncil: (regionalCouncil: string) => void;
  regionalCouncilOptions: string[];
  selectedRegionalCouncils: string[];
};

export function UserRegionalCouncilAssignmentField({
  errorMessage,
  helperText,
  onToggleRegionalCouncil,
  regionalCouncilOptions,
  selectedRegionalCouncils,
}: UserRegionalCouncilAssignmentFieldProps) {
  const selectedCount = selectedRegionalCouncils.length;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>שיוך מועצות</Text>
        <Text style={styles.meta}>{selectedCount} נבחרו</Text>
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <View style={styles.chips}>
        {regionalCouncilOptions.map((regionalCouncil) => {
          const isSelected = selectedRegionalCouncils.includes(regionalCouncil);

          return (
            <AppChip
              key={regionalCouncil}
              label={regionalCouncil}
              onPress={() => {
                onToggleRegionalCouncil(regionalCouncil);
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
    ...rtlRow,
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
