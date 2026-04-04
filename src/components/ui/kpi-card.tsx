import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { SurfaceCard } from '@/src/components/ui/surface-card';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type KpiCardTone = 'accent' | 'default' | 'info' | 'warning';

type KpiCardProps = {
  helperText?: string | null;
  isLoading?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  tone?: KpiCardTone;
  value: string;
};

export function KpiCard({
  helperText,
  isLoading = false,
  label,
  style,
  tone = 'default',
  value,
}: KpiCardProps) {
  const shimmer = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!isLoading) {
      shimmer.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          duration: 850,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          duration: 850,
          toValue: 0.45,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isLoading, shimmer]);

  return (
    <SurfaceCard compact style={[styles.card, style]} tone="default">
      {isLoading ? (
        <View style={styles.skeletonWrapper}>
          <Animated.View style={[styles.skeletonValue, { opacity: shimmer }]} />
          <Animated.View style={[styles.skeletonLabel, { opacity: shimmer }]} />
        </View>
      ) : (
        <>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            numberOfLines={1}
            style={[styles.value, valueToneStyles[tone]]}
          >
            {value}
          </Text>
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
          {helperText ? (
            <Text numberOfLines={1} style={styles.helper}>
              {helperText}
            </Text>
          ) : null}
        </>
      )}
    </SurfaceCard>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  card: {
    justifyContent: 'center',
    minHeight: 76,
  },
  helper: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    marginTop: 1,
    textAlign: 'right',
  },
  label: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  skeletonLabel: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    height: 10,
    width: '48%',
  },
  skeletonValue: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 30,
    width: '56%',
  },
  skeletonWrapper: {
    gap: 5,
    justifyContent: 'center',
    minHeight: 50,
  },
  value: {
    ...theme.typography.metric,
    letterSpacing: -0.6,
    textAlign: 'right',
  },
}));

const valueToneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    color: theme.colors.accentStrong,
  },
  default: {
    color: theme.colors.textPrimary,
  },
  info: {
    color: theme.colors.info,
  },
  warning: {
    color: theme.colors.warning,
  },
}));
