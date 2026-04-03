import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/src/theme';

export type FilterChipTone = 'accent' | 'neutral' | 'warning';

type FilterChipProps = {
  count?: number;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: FilterChipTone;
};

export function FilterChip({
  count,
  disabled = false,
  label,
  onPress,
  selected = false,
  style,
  tone = 'neutral',
}: FilterChipProps) {
  const displayLabel = typeof count === 'number' ? `${label} ${count}` : label;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toneStyles[tone],
        selected ? selectedToneStyles[tone] : null,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          labelToneStyles[tone],
          selected ? selectedLabelToneStyles[tone] : null,
        ]}
      >
        {displayLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...theme.typography.badge,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.976 }],
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.surface,
  },
  neutral: {
    backgroundColor: theme.colors.surface,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
  },
});

const selectedToneStyles = StyleSheet.create({
  accent: {
    ...theme.elevation.focus,
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.info,
  },
  neutral: {
    ...theme.elevation.focus,
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.info,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warning,
  },
});

const labelToneStyles = StyleSheet.create({
  accent: {
    color: theme.colors.textSecondary,
  },
  neutral: {
    color: theme.colors.textSecondary,
  },
  warning: {
    color: theme.colors.warning,
  },
});

const selectedLabelToneStyles = StyleSheet.create({
  accent: {
    color: theme.colors.info,
  },
  neutral: {
    color: theme.colors.info,
  },
  warning: {
    color: theme.colors.warning,
  },
});
