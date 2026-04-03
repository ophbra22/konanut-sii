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
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  header: {
    gap: 2,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  wrapper: {
    gap: 10,
  },
});
