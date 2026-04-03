import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type AppBadgeTone = 'accent' | 'danger' | 'info' | 'neutral' | 'teal' | 'warning';
type AppBadgeSize = 'md' | 'sm';

type AppBadgeProps = {
  label: string;
  size?: AppBadgeSize;
  tone?: AppBadgeTone;
};

export function AppBadge({
  label,
  size = 'md',
  tone = 'neutral',
}: AppBadgeProps) {
  return (
    <View style={[styles.badge, sizeStyles[size], toneStyles[tone]]}>
      <Text style={[styles.label, labelStyles[tone], labelSizeStyles[size]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  label: {
    fontWeight: '700',
  },
});

const sizeStyles = StyleSheet.create({
  md: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
});

const labelSizeStyles = StyleSheet.create({
  md: {
    fontSize: 12,
  },
  sm: {
    fontSize: 10,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.overlay,
  },
  danger: {
    backgroundColor: 'rgba(255, 114, 87, 0.14)',
  },
  info: {
    backgroundColor: theme.colors.surfaceInfo,
  },
  neutral: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  teal: {
    backgroundColor: theme.colors.surfaceTeal,
  },
  warning: {
    backgroundColor: 'rgba(245, 178, 75, 0.16)',
  },
});

const labelStyles = StyleSheet.create({
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
  teal: {
    color: theme.colors.teal,
  },
  warning: {
    color: theme.colors.warning,
  },
});
