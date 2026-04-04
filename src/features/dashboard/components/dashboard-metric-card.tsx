import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/src/theme';

type DashboardMetricTone = 'accent' | 'default' | 'warning';

type DashboardMetricCardProps = {
  emptyLabel?: string;
  errorMessage?: string | null;
  isEmpty?: boolean;
  isLoading?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  tone?: DashboardMetricTone;
  value: string;
};

export function DashboardMetricCard({
  emptyLabel = 'אין נתונים',
  errorMessage,
  isEmpty = false,
  isLoading = false,
  label,
  style,
  tone = 'default',
  value,
}: DashboardMetricCardProps) {
  const shimmer = useRef(new Animated.Value(0.38)).current;
  const helperText = errorMessage
    ? 'שגיאה בטעינת הנתון'
    : isEmpty
      ? emptyLabel
      : null;

  useEffect(() => {
    if (!isLoading) {
      shimmer.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          duration: 780,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          duration: 780,
          toValue: 0.38,
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
    <View style={[styles.card, cardToneStyles[errorMessage ? 'warning' : tone], style]}>
      {isLoading ? (
        <View style={styles.skeleton}>
          <Animated.View style={[styles.skeletonValue, { opacity: shimmer }]} />
          <Animated.View style={[styles.skeletonLabel, { opacity: shimmer }]} />
        </View>
      ) : (
        <>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.84}
            numberOfLines={1}
            style={[styles.value, valueToneStyles[errorMessage ? 'warning' : tone]]}
          >
            {errorMessage ? 'שגיאה' : value}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    gap: 4,
    justifyContent: 'center',
    minHeight: 62,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  helper: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'right',
  },
  label: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  skeleton: {
    gap: 6,
    justifyContent: 'center',
    minHeight: 38,
  },
  skeletonLabel: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    height: 10,
    width: '44%',
  },
  skeletonValue: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 26,
    width: '54%',
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 30,
    textAlign: 'right',
  },
});

const cardToneStyles = StyleSheet.create({
  accent: {
    backgroundColor: 'rgba(143, 175, 84, 0.08)',
  },
  default: {
    backgroundColor: theme.colors.surface,
  },
  warning: {
    backgroundColor: 'rgba(245, 178, 75, 0.10)',
  },
});

const valueToneStyles = StyleSheet.create({
  accent: {
    color: theme.colors.accentStrong,
  },
  default: {
    color: theme.colors.textPrimary,
  },
  warning: {
    color: theme.colors.warning,
  },
});
