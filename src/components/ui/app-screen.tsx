import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { createThemedStyles, type AppTheme, useThemeMode } from '@/src/theme';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

export function AppScreen({
  children,
  contentContainerStyle,
  scroll = true,
}: AppScreenProps) {
  const themeMode = useThemeMode();
  const content = scroll ? (
    <KeyboardSafeScrollView
      key={themeMode}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {children}
    </KeyboardSafeScrollView>
  ) : (
    <View key={themeMode} style={[styles.content, styles.fill, contentContainerStyle]}>
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
    left: -84,
    opacity: 0.2,
    position: 'absolute',
    width: 236,
  },
  content: {
    gap: theme.spacing.section,
    paddingBottom: 28,
    paddingHorizontal: theme.spacing.page,
    paddingTop: 12,
  },
  fill: {
    flex: 1,
  },
  gridHorizontal: {
    backgroundColor: theme.colors.gridLine,
    height: 1,
    left: 0,
    opacity: 0.35,
    position: 'absolute',
    right: 0,
    top: 84,
  },
  gridVertical: {
    backgroundColor: theme.colors.gridLine,
    bottom: 0,
    opacity: 0.2,
    position: 'absolute',
    right: 28,
    top: 0,
    width: 1,
  },
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  topGlow: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 240,
    height: 284,
    opacity: 0.24,
    position: 'absolute',
    right: -120,
    top: -140,
    width: 284,
  },
}));
