import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type ListCardProps = {
  badge?: ReactNode;
  disabled?: boolean;
  footer?: ReactNode;
  onPress?: () => void;
  statusDotColor?: string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title: string;
};

export function ListCard({
  badge,
  disabled = false,
  footer,
  onPress,
  statusDotColor,
  style,
  subtitle,
  title,
}: ListCardProps) {
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        disabled && styles.disabled,
        pressed && onPress ? styles.pressed : null,
        style,
      ]}
    >
      <View style={styles.topRow}>
        {badge || statusDotColor ? (
          <View style={styles.leadingBlock}>
            {badge}
            {statusDotColor ? (
              <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
            ) : null}
          </View>
        ) : null}

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>

      {subtitle ? (
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  card: {
    ...theme.elevation.card,
    alignItems: 'stretch',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    direction: 'ltr',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 9,
  },
  disabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'flex-end',
    minHeight: 14,
  },
  leadingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.988 }],
  },
  statusDot: {
    borderRadius: theme.radius.pill,
    height: 6,
    width: 6,
  },
  subtitle: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  topRow: {
    alignItems: 'center',
    direction: 'ltr',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
}));
