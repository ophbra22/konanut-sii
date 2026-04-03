import { StyleSheet, Text } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { theme } from '@/src/theme';

type MetricTone = 'accent' | 'danger' | 'default' | 'info' | 'warning';

type MetricCardProps = {
  label: string;
  tone?: MetricTone;
  value: string;
};

export function MetricCard({
  label,
  tone = 'default',
  value,
}: MetricCardProps) {
  return (
    <AppCard
      style={styles.card}
      variant={tone === 'accent' || tone === 'warning' ? tone : 'default'}
    >
      <Text style={[styles.value, valueStyles[tone]]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 132,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
  },
});

const valueStyles = StyleSheet.create({
  accent: {
    color: theme.colors.accentStrong,
  },
  danger: {
    color: theme.colors.danger,
  },
  default: {
    color: theme.colors.textPrimary,
  },
  info: {
    color: theme.colors.info,
  },
  warning: {
    color: theme.colors.warning,
  },
});
