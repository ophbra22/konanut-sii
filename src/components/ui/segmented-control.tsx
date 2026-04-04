import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles, type AppTheme } from '@/src/theme';

type SegmentedOption<T extends string> = {
  icon?: ReactNode;
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
};

export function SegmentedControl<T extends string>({
  onValueChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.wrapper}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!isActive) {
                onValueChange(option.value);
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              isActive ? styles.segmentActive : null,
              pressed && !isActive ? styles.segmentPressed : null,
            ]}
          >
            <View style={styles.segmentContent}>
              {option.icon}
              <Text style={[styles.label, isActive ? styles.labelActive : null]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  label: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  segment: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentActive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.infoBorder,
    borderWidth: 1,
    ...theme.elevation.card,
  },
  segmentContent: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  segmentPressed: {
    opacity: 0.84,
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 6,
    padding: 4,
  },
}));
