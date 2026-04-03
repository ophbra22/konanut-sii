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
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  description: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'right',
  },
});

const cardVariants = StyleSheet.create({
  accent: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  default: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  warning: {
    backgroundColor: theme.colors.surfaceWarning,
  },
});
