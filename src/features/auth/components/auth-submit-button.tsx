import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  createThemedStyles,
  type AppTheme,
  useAppTheme,
} from '@/src/theme';

type AuthSubmitButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onPress: () => void;
};

export function AuthSubmitButton({
  disabled = false,
  label,
  loading = false,
  loadingLabel = 'טוען...',
  onPress,
}: AuthSubmitButtonProps) {
  const appTheme = useAppTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled ? styles.buttonPressed : null,
        isDisabled ? styles.buttonDisabled : null,
      ]}
    >
      <LinearGradient
        colors={[
          appTheme.colors.primaryStrong,
          appTheme.colors.primary,
          appTheme.colors.info,
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.gradient}
      >
        <View pointerEvents="none" style={styles.highlight} />
        <View pointerEvents="none" style={styles.lowlight} />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={appTheme.colors.inverseText} size="small" />
            <Text style={styles.label}>{loadingLabel}</Text>
          </View>
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  button: {
    ...theme.elevation.hero,
    borderRadius: 20,
    shadowOpacity: 0.24,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.82,
    shadowOpacity: 0.1,
  },
  buttonPressed: {
    transform: [{ scale: 0.987 }, { translateY: 1 }],
  },
  gradient: {
    alignItems: 'center',
    borderColor: theme.colors.infoBorder,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 58,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.lg,
    position: 'relative',
  },
  highlight: {
    backgroundColor: theme.colors.highlightOverlay,
    borderRadius: theme.radius.pill,
    height: 40,
    left: 18,
    opacity: 0.74,
    position: 'absolute',
    right: 18,
    top: 1,
  },
  label: {
    color: theme.colors.inverseText,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  lowlight: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: theme.radius.pill,
    bottom: -8,
    height: 28,
    left: 20,
    opacity: 0.48,
    position: 'absolute',
    right: 20,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
}));
