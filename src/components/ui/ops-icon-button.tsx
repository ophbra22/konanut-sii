import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type OpsIconButtonProps = {
  accessibilityLabel?: string;
  accent?: boolean;
  icon: ComponentType<{ color: string; size: number }>;
  onPress: () => void;
};

export function OpsIconButton({
  accessibilityLabel,
  accent = false,
  icon: Icon,
  onPress,
}: OpsIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        accent && styles.buttonAccent,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        color={accent ? theme.colors.info : theme.colors.textPrimary}
        size={17}
      />
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    ...theme.elevation.card,
    width: 36,
  },
  buttonAccent: {
    backgroundColor: theme.colors.surfaceInfo,
    borderColor: theme.colors.infoBorder,
    ...theme.elevation.focus,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.975 }],
  },
}));
