import type { StyleProp, ViewStyle } from 'react-native';

import { FilterChip, type FilterChipTone } from '@/src/components/ui/filter-chip';

type AppChipProps = {
  count?: number;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: FilterChipTone;
};

export function AppChip({
  count,
  disabled = false,
  label,
  onPress,
  selected = false,
  style,
  tone = 'neutral',
}: AppChipProps) {
  return (
    <FilterChip
      count={count}
      disabled={disabled}
      label={label}
      onPress={onPress}
      selected={selected}
      style={style}
      tone={tone}
    />
  );
}
