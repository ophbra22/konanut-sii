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
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
  value: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
});
