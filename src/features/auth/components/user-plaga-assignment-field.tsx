import { StyleSheet, Text, View } from 'react-native';

import { AppChip } from '@/src/components/ui/app-chip';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type UserPlagaAssignmentFieldProps = {
  errorMessage?: string;
  helperText?: string;
  onSelectPlaga: (plaga: string) => void;
  plagaOptions: readonly string[];
  selectedPlaga: string | null;
};

export function UserPlagaAssignmentField({
  errorMessage,
  helperText,
  onSelectPlaga,
  plagaOptions,
  selectedPlaga,
}: UserPlagaAssignmentFieldProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>שיוך פלגה</Text>
        <Text style={styles.meta}>{selectedPlaga ? 'נבחרה פלגה' : 'לא הוגדרה פלגה'}</Text>
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <View style={styles.chips}>
        {plagaOptions.map((plaga) => {
          const isSelected = selectedPlaga === plaga;

          return (
            <AppChip
              key={plaga}
              label={plaga}
              onPress={() => {
                onSelectPlaga(plaga);
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
