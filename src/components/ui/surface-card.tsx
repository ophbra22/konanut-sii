import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

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

const styles = createThemedStyles((theme: AppTheme) => ({
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
}));

const toneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentBorder,
  },
  danger: {
    backgroundColor: theme.colors.surfaceDanger,
    borderColor: theme.colors.dangerBorder,
  },
  default: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
  },
  info: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.infoBorder,
  },
  neutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
    borderColor: theme.colors.warningBorder,
  },
}));
