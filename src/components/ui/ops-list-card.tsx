import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/src/theme';

type OpsListCardProps = PropsWithChildren<{
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export function OpsListCard({
  children,
  disabled = false,
  onPress,
  style,
}: OpsListCardProps) {
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.pressed : null,
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...theme.elevation.card,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
  },
  content: {
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 9,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.988 }],
  },
});
