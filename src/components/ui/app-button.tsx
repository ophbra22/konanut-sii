import { useRouter } from 'expo-router/build/hooks';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/src/theme';

export type AppButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';
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

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});

const variantStyles = StyleSheet.create({
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.info,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
  },
});

const labelStyles = StyleSheet.create({
  danger: {
    color: theme.colors.background,
  },
  ghost: {
    color: theme.colors.textPrimary,
  },
  primary: {
    color: theme.colors.background,
  },
  secondary: {
    color: theme.colors.textPrimary,
  },
});
