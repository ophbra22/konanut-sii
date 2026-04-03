import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { theme } from '@/src/theme';

type AppCardVariant = 'default' | 'accent' | 'warning';

type AppCardProps = PropsWithChildren<{
  description?: string;
  style?: ViewStyle;
  title?: string;
  variant?: AppCardVariant;
}>;

export function AppCard({
  children,
  description,
  style,
  title,
  variant = 'default',
}: AppCardProps) {
  return (
    <View style={[styles.card, cardVariants[variant], style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
});

const cardVariants = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  default: {
    backgroundColor: theme.colors.surface,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
  },
});
