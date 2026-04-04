import { StyleSheet, Text, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

export type StatusBadgeTone =
  | 'accent'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'success'
  | 'teal'
  | 'warning';
export type StatusBadgeSize = 'md' | 'sm';

type StatusBadgeProps = {
  label: string;
  size?: StatusBadgeSize;
  tone?: StatusBadgeTone;
};

export function StatusBadge({
  label,
  size = 'md',
  tone = 'neutral',
}: StatusBadgeProps) {
  return (
    <View style={[styles.base, sizeStyles[size], toneStyles[tone]]}>
      <Text style={[styles.label, labelSizeStyles[size], labelToneStyles[tone]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: {
    ...theme.typography.badge,
    textAlign: 'center',
  },
}));

const sizeStyles = createThemedStyles((theme: AppTheme) => ({
  md: {
    minHeight: 24,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sm: {
    minHeight: 21,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
}));

const labelSizeStyles = createThemedStyles((theme: AppTheme) => ({
  md: {
    fontSize: theme.typography.badge.fontSize,
  },
  sm: {
    fontSize: 10,
    lineHeight: 11,
  },
}));

const toneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    backgroundColor: theme.colors.overlay,
    borderColor: theme.colors.accentBorder,
  },
  danger: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
  },
  neutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.accentBorder,
  },
  teal: {
    backgroundColor: theme.colors.surfaceTeal,
    borderColor: theme.colors.tealBorder,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
  },
}));

const labelToneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    color: theme.colors.accentStrong,
  },
  danger: {
    color: theme.colors.danger,
  },
  info: {
    color: theme.colors.info,
  },
  neutral: {
    color: theme.colors.textSecondary,
  },
  success: {
    color: theme.colors.success,
  },
  teal: {
    color: theme.colors.teal,
  },
  warning: {
    color: theme.colors.warning,
  },
}));
