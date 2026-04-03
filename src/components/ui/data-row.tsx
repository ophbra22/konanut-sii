import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

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

const styles = StyleSheet.create({
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  value: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'left',
  },
});
