import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type OpsIconButtonProps = {
  accessibilityLabel?: string;
  accent?: boolean;
  icon: ComponentType<{ color: string; size: number }>;
  onPress: () => void;
  showIndicator?: boolean;
};

export function OpsIconButton({
  accessibilityLabel,
  accent = false,
  icon: Icon,
  onPress,
  showIndicator = false,
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
      {showIndicator ? <View style={styles.indicator} /> : null}
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
  indicator: {
    backgroundColor: theme.colors.accentStrong,
    borderColor: theme.colors.background,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    height: 8,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.975 }],
  },
}));
