import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/src/theme';

export type SurfaceCardTone =
  | 'accent'
  | 'danger'
  | 'default'
  | 'info'
  | 'neutral'
  | 'warning';

type SurfaceCardProps = PropsWithChildren<{
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: SurfaceCardTone;
}>;

export function SurfaceCard({
  children,
  compact = false,
  style,
  tone = 'default',
}: SurfaceCardProps) {
  return (
    <View
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        toneStyles[tone],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...theme.elevation.card,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  compact: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  regular: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: 'rgba(199, 243, 107, 0.16)',
  },
  danger: {
    backgroundColor: theme.colors.surfaceDanger,
    borderColor: 'rgba(255, 114, 87, 0.26)',
  },
  default: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
  },
  info: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(108, 143, 255, 0.34)',
  },
  neutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
    borderColor: 'rgba(245, 178, 75, 0.24)',
  },
});
