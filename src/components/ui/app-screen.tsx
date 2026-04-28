import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import {
  createThemedStyles,
  type AppTheme,
  useAppTheme,
  useThemeMode,
} from '@/src/theme';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

export function AppScreen({
  children,
  contentContainerStyle,
  scroll = true,
}: AppScreenProps) {
  const theme = useAppTheme();
  const themeMode = useThemeMode();
  const content = scroll ? (
    <KeyboardSafeScrollView
      key={themeMode}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardExtraPadding={theme.spacing.sm}
    >
      {children}
    </KeyboardSafeScrollView>
  ) : (
    <View
      key={themeMode}
      style={[styles.content, styles.nonScrollableContent, styles.fill, contentContainerStyle]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.root}>
        <View pointerEvents="none" style={styles.gridHorizontal} />
        <View pointerEvents="none" style={styles.gridVertical} />
        <View pointerEvents="none" style={styles.topGlow} />
        <View pointerEvents="none" style={styles.bottomGlow} />
        {content}
      </View>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  bottomGlow: {
    backgroundColor: theme.colors.glowMuted,
    borderRadius: 220,
    bottom: -168,
    height: 236,
    opacity: 0.2,
    position: 'absolute',
    start: -84,
    width: 236,
  },
  content: {
    direction: 'ltr',
    gap: theme.spacing.section,
    maxWidth: '100%',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.page,
    paddingTop: 12,
    width: '100%',
  },
  fill: {
    flex: 1,
  },
  nonScrollableContent: {
    paddingBottom: 0,
  },
  gridHorizontal: {
    backgroundColor: theme.colors.gridLine,
    end: 0,
    height: 1,
    opacity: 0.35,
    position: 'absolute',
    start: 0,
    top: 84,
  },
  gridVertical: {
    backgroundColor: theme.colors.gridLine,
    bottom: 0,
    end: 28,
    opacity: 0.2,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  root: {
    backgroundColor: theme.colors.background,
    direction: 'ltr',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    direction: 'ltr',
    flex: 1,
    width: '100%',
  },
  topGlow: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 240,
    height: 284,
    opacity: 0.24,
    position: 'absolute',
    end: -120,
    top: -140,
    width: 284,
  },
}));
