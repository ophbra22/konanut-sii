import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { theme } from '@/src/theme';

type AppChipTone = 'accent' | 'neutral' | 'warning';

type AppChipProps = {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  tone?: AppChipTone;
};

export function AppChip({
  disabled = false,
  label,
  onPress,
  selected = false,
  style,
  tone = 'neutral',
}: AppChipProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toneStyles[tone],
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, labelStyles[tone], selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  selected: {
    borderColor: theme.colors.accentStrong,
    backgroundColor: theme.colors.overlay,
  },
  selectedLabel: {
    color: theme.colors.accentStrong,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  neutral: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
  },
});

const labelStyles = StyleSheet.create({
  accent: {
    color: theme.colors.textPrimary,
  },
  neutral: {
    color: theme.colors.textSecondary,
  },
  warning: {
    color: theme.colors.warning,
  },
});
