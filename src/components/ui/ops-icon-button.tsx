import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { theme } from '@/src/theme';

type OpsIconButtonProps = {
  accent?: boolean;
  icon: ComponentType<{ color: string; size: number }>;
  onPress: () => void;
};

export function OpsIconButton({
  accent = false,
  icon: Icon,
  onPress,
}: OpsIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        accent && styles.buttonAccent,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        color={accent ? theme.colors.background : theme.colors.textPrimary}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  buttonAccent: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.info,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
