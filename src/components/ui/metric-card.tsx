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
      <Text style={[styles.value, valueStyles[tone]]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
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
