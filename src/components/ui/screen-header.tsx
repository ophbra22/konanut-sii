import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type ScreenHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function ScreenHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.actions}>{actions}</View>

        <View style={styles.titleBlock}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    minHeight: 36,
    minWidth: 40,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  titleBlock: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '76%',
  },
  wrapper: {
    gap: theme.spacing.xxs,
  },
});
