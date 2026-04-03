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
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  content: {
    gap: theme.spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});
