import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme';

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
        colors={[theme.colors.primaryStrong, theme.colors.primary]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.gradient}
      >
        <View pointerEvents="none" style={styles.highlight} />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.inverseText} size="small" />
            <Text style={styles.label}>{loadingLabel}</Text>
          </View>
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    ...theme.elevation.hero,
    borderRadius: 18,
    shadowOpacity: 0.2,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.78,
  },
  buttonPressed: {
    transform: [{ scale: 0.986 }, { translateY: 1 }],
  },
  gradient: {
    alignItems: 'center',
    borderColor: 'rgba(141, 168, 255, 0.32)',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.lg,
    position: 'relative',
  },
  highlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    height: 38,
    left: 14,
    opacity: 0.7,
    position: 'absolute',
    right: 14,
    top: 0,
  },
  label: {
    color: theme.colors.inverseText,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
});
