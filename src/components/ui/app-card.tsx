import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { SurfaceCard, type SurfaceCardTone } from '@/src/components/ui/surface-card';
import { theme } from '@/src/theme';

type AppCardProps = PropsWithChildren<{
  description?: string;
  style?: StyleProp<ViewStyle>;
  title?: string;
  variant?: SurfaceCardTone;
}>;

export function AppCard({
  children,
  description,
  style,
  title,
  variant = 'default',
}: AppCardProps) {
  return (
    <SurfaceCard style={style} tone={variant}>
      {title || description ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      ) : null}
      {children}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  description: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  header: {
    gap: 4,
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
});
