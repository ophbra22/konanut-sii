import { StyleSheet, Text, View } from 'react-native';

import { AppChip } from '@/src/components/ui/app-chip';
import { theme } from '@/src/theme';

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

const styles = StyleSheet.create({
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
});
