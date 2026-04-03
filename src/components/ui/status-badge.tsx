import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

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

const styles = StyleSheet.create({
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
});

const sizeStyles = StyleSheet.create({
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
});

const labelSizeStyles = StyleSheet.create({
  md: {
    fontSize: theme.typography.badge.fontSize,
  },
  sm: {
    fontSize: 10,
    lineHeight: 11,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.overlay,
    borderColor: 'rgba(199, 243, 107, 0.20)',
  },
  danger: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: 'rgba(255, 114, 87, 0.22)',
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: 'rgba(108, 143, 255, 0.28)',
  },
  neutral: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.successSurface,
    borderColor: 'rgba(199, 243, 107, 0.22)',
  },
  teal: {
    backgroundColor: theme.colors.surfaceTeal,
    borderColor: 'rgba(77, 195, 178, 0.26)',
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: 'rgba(245, 178, 75, 0.24)',
  },
});

const labelToneStyles = StyleSheet.create({
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
});
