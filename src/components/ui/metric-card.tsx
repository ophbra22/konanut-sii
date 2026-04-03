import { StyleSheet, Text } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { theme } from '@/src/theme';

type MetricTone = 'accent' | 'default' | 'warning';

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
    <AppCard style={styles.card} variant={tone === 'default' ? 'default' : tone}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyles[tone]]}>{value}</Text>
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
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
});

const valueStyles = StyleSheet.create({
  accent: {
    color: theme.colors.accentStrong,
  },
  default: {
    color: theme.colors.textPrimary,
  },
  warning: {
    color: theme.colors.warning,
  },
});
