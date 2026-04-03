import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type OpsListHeaderProps = {
  actions?: ReactNode;
  subtitle?: string;
  title: string;
};

export function OpsListHeader({
  actions,
  subtitle,
  title,
}: OpsListHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.actions}>{actions}</View>

        <View style={styles.titleBlock}>
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
    gap: theme.spacing.sm,
    minWidth: 40,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'right',
  },
  titleBlock: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: '72%',
  },
  wrapper: {
    gap: theme.spacing.sm,
  },
});
