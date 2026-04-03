import { useRouter } from 'expo-router/build/hooks';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { theme } from '@/src/theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost';
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
  label: string;
  href?: AppButtonHref;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: AppButtonVariant;
};

export function AppButton({
  label,
  href,
  loading = false,
  disabled = false,
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
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});

const variantStyles = StyleSheet.create({
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: theme.colors.accentStrong,
    borderColor: theme.colors.accentStrong,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
});

const labelStyles = StyleSheet.create({
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
