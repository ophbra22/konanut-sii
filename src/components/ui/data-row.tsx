import { StyleSheet, Text, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type DataRowProps = {
  label: string;
  value: string;
};

export function DataRow({ label, value }: DataRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  label: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  value: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
}));
