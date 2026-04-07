import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  createThemedStyles,
  type AppTheme,
  useAppTheme,
} from '@/src/theme';

type AuthSubmitButtonProps = {
  compact?: boolean;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onPress: () => void;
};

export function AuthSubmitButton({
  compact = false,
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
        compact ? styles.buttonCompact : null,
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
        style={[styles.gradient, compact ? styles.gradientCompact : null]}
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
    borderRadius: 18,
    shadowOpacity: 0.18,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.82,
    shadowOpacity: 0.1,
  },
  buttonCompact: {
    shadowOpacity: 0.16,
  },
  buttonPressed: {
    transform: [{ scale: 0.988 }, { translateY: 1 }],
  },
  gradient: {
    alignItems: 'center',
    borderColor: theme.colors.infoBorder,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    overflow: 'hidden',
    paddingHorizontal: 18,
    position: 'relative',
  },
  gradientCompact: {
    minHeight: 50,
    paddingHorizontal: 16,
  },
  highlight: {
    backgroundColor: theme.colors.highlightOverlay,
    borderRadius: theme.radius.pill,
    height: 34,
    left: 16,
    opacity: 0.66,
    position: 'absolute',
    right: 16,
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
    height: 24,
    left: 18,
    opacity: 0.34,
    position: 'absolute',
    right: 18,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
}));
