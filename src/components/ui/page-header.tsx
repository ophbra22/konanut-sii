import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type PageHeaderProps = {
  eyebrow: string;
  subtitle: string;
  title: string;
};

export function PageHeader({ eyebrow, subtitle, title }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xxs,
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textAlign: 'right',
  },
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'right',
  },
});
