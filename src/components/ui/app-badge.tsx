import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type AppBadgeTone = 'accent' | 'danger' | 'neutral' | 'warning';

type AppBadgeProps = {
  label: string;
  tone?: AppBadgeTone;
};

export function AppBadge({ label, tone = 'neutral' }: AppBadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <Text style={[styles.label, labelStyles[tone]]}>{label}</Text>
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
    fontSize: 12,
    fontWeight: '700',
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.overlay,
  },
  danger: {
    backgroundColor: 'rgba(255, 114, 87, 0.14)',
  },
  neutral: {
    backgroundColor: theme.colors.surfaceStrong,
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
  neutral: {
    color: theme.colors.textSecondary,
  },
  warning: {
    color: theme.colors.warning,
  },
});
