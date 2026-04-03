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
    borderColor: theme.colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.975 }],
  },
  selected: {
    backgroundColor: theme.colors.surfaceInfo,
    borderColor: theme.colors.info,
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  selectedLabel: {
    color: theme.colors.info,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  neutral: {
    backgroundColor: theme.colors.surface,
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
