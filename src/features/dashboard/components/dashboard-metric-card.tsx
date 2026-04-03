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
    gap: 3,
    justifyContent: 'center',
    minHeight: 92,
    minWidth: 148,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorValue: {
    color: theme.colors.warning,
    fontSize: 24,
  },
  helper: {
    color: theme.colors.textMuted,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'right',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  skeletonLabel: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    height: 10,
    width: '52%',
  },
  skeletonValue: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 30,
    width: '52%',
  },
  skeletonWrapper: {
    gap: 5,
    justifyContent: 'center',
    minHeight: 58,
  },
  value: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
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
