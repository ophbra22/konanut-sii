import { StyleSheet, Text, View } from 'react-native';

import { useFeedbackStore } from '@/src/stores/feedback-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

export function AppToast() {
  const isVisible = useFeedbackStore((state) => state.isVisible);
  const message = useFeedbackStore((state) => state.message);
  const tone = useFeedbackStore((state) => state.tone);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={[styles.toast, toneStyles[tone]]}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  message: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  toast: {
    ...theme.elevation.card,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    maxWidth: 420,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: '100%',
  },
  wrapper: {
    alignItems: 'center',
    bottom: theme.spacing.lg,
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
  },
}));

const toneStyles = createThemedStyles((theme: AppTheme) => ({
  error: {
    backgroundColor: theme.colors.surfaceDanger,
  },
  info: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  success: {
    backgroundColor: theme.colors.surfaceAccent,
  },
}));
