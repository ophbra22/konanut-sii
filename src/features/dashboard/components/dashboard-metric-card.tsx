import type { StyleProp, ViewStyle } from 'react-native';

import { KpiCard } from '@/src/components/ui/kpi-card';

type DashboardMetricTone = 'accent' | 'default' | 'warning';

type DashboardMetricCardProps = {
  emptyLabel?: string;
  errorMessage?: string | null;
  isEmpty?: boolean;
  isLoading?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  tone?: DashboardMetricTone;
  value: string;
};

export function DashboardMetricCard({
  emptyLabel = 'אין נתונים',
  errorMessage,
  isEmpty = false,
  isLoading = false,
  label,
  style,
  tone = 'default',
  value,
}: DashboardMetricCardProps) {
  const helperText = errorMessage
    ? 'שגיאה בטעינת הנתון'
    : isEmpty
      ? emptyLabel
      : null;

  return (
    <KpiCard
      helperText={helperText}
      isLoading={isLoading}
      label={label}
      style={style}
      tone={errorMessage ? 'warning' : tone}
      value={errorMessage ? 'שגיאה' : value}
    />
  );
}
