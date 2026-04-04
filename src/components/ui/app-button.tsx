import { useRouter } from 'expo-router/build/hooks';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

export type AppButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';
export type AppButtonSize = 'md' | 'sm';
type RouterHref = Parameters<ReturnType<typeof useRouter>['push']>[0];

export type AppButtonHref =
  | string
  | {
      pathname: string;
      params?: Record<
        string,
        string | number | null | undefined | Array<string | number>
      >;
    };

type AppButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  href?: AppButtonHref;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  variant?: AppButtonVariant;
};

export function AppButton({
  label,
  href,
  loading = false,
  disabled = false,
  fullWidth = true,
  onPress,
  size = 'md',
  style,
  variant = 'primary',
}: AppButtonProps) {
  const router = useRouter();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => {
        onPress?.();

        if (href) {
          router.push(href as RouterHref);
        }
      }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        fullWidth ? styles.fullWidth : styles.autoWidth,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant]]}>
        {loading ? 'טוען...' : label}
      </Text>
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  base: {
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
  },
  autoWidth: {
    width: 'auto',
  },
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    ...theme.typography.caption,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
}));

const sizeStyles = createThemedStyles((theme: AppTheme) => ({
  md: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
  sm: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
}));

const variantStyles = createThemedStyles((theme: AppTheme) => ({
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    ...theme.elevation.card,
  },
  ghost: {
    backgroundColor: theme.colors.glassSurface,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.info,
    borderWidth: 1,
    ...theme.elevation.focus,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
  },
}));

const labelStyles = createThemedStyles((theme: AppTheme) => ({
  danger: {
    color: theme.colors.inverseText,
  },
  ghost: {
    color: theme.colors.textSecondary,
  },
  primary: {
    color: theme.colors.inverseText,
  },
  secondary: {
    color: theme.colors.textPrimary,
  },
}));
