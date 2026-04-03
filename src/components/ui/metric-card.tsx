import type { StyleProp, ViewStyle } from 'react-native';

import { KpiCard } from '@/src/components/ui/kpi-card';

type MetricTone = 'accent' | 'danger' | 'default' | 'info' | 'warning';

type MetricCardProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
  tone?: MetricTone;
  value: string;
};

export function MetricCard({
  label,
  style,
  tone = 'default',
  value,
}: MetricCardProps) {
  return (
    <KpiCard
      label={label}
      style={style}
      tone={tone === 'danger' ? 'warning' : tone}
      value={value}
    />
  );
}
