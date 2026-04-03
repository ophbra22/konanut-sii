import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type SectionBlockProps = PropsWithChildren<{
  description?: string;
  title: string;
}>;

export function SectionBlock({
  children,
  description,
  title,
}: SectionBlockProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  header: {
    gap: theme.spacing.xxs,
  },
  title: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  wrapper: {
    gap: theme.spacing.sm,
  },
});
