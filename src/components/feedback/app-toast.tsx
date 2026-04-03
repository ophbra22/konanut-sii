import { StyleSheet, Text, View } from 'react-native';

import { useFeedbackStore } from '@/src/stores/feedback-store';
import { theme } from '@/src/theme';

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

const styles = StyleSheet.create({
  message: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  toast: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    maxWidth: 420,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  wrapper: {
    alignItems: 'center',
    bottom: theme.spacing.lg,
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
  },
});

const toneStyles = StyleSheet.create({
  error: {
    backgroundColor: '#321814',
  },
  info: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  success: {
    backgroundColor: theme.colors.surfaceAccent,
  },
});
