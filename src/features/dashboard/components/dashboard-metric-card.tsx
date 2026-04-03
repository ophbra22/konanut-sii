import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { theme } from '@/src/theme';

type DashboardMetricTone = 'accent' | 'default' | 'warning';

type DashboardMetricCardProps = {
  emptyLabel?: string;
  errorMessage?: string | null;
  isEmpty?: boolean;
  isLoading?: boolean;
  label: string;
  tone?: DashboardMetricTone;
  value: string;
};

export function DashboardMetricCard({
  emptyLabel = 'אין נתונים',
  errorMessage,
  isEmpty = false,
  isLoading = false,
  label,
  tone = 'default',
  value,
}: DashboardMetricCardProps) {
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

  const helperText = errorMessage
    ? 'שגיאה בטעינת הנתון'
    : isEmpty
      ? emptyLabel
      : null;

  const displayValue = errorMessage ? 'שגיאה' : isEmpty ? value : value;
  const variant = errorMessage ? 'warning' : tone === 'default' ? 'default' : tone;

  return (
    <AppCard style={styles.card} variant={variant}>
      {isLoading ? (
        <View style={styles.skeletonWrapper}>
          <Animated.View style={[styles.skeletonValue, { opacity: shimmer }]} />
          <Animated.View style={[styles.skeletonLabel, { opacity: shimmer }]} />
        </View>
      ) : (
        <>
          <Text style={[styles.value, valueStyles[tone], errorMessage && styles.errorValue]}>
            {displayValue}
          </Text>
          <Text style={styles.label}>{label}</Text>
          {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
        </>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
  errorValue: {
    color: theme.colors.warning,
    fontSize: 18,
  },
  helper: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  skeletonLabel: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    height: 12,
    width: '55%',
  },
  skeletonValue: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 28,
    width: '70%',
  },
  skeletonWrapper: {
    gap: theme.spacing.sm,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
});

const valueStyles = StyleSheet.create({
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
