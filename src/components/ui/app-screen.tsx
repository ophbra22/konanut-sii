import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/src/theme';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

export function AppScreen({
  children,
  contentContainerStyle,
  scroll = true,
}: AppScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentContainerStyle]}>{children}</View>
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

const styles = StyleSheet.create({
  bottomGlow: {
    backgroundColor: theme.colors.glowMuted,
    borderRadius: 220,
    bottom: -170,
    height: 250,
    left: -80,
    opacity: 0.24,
    position: 'absolute',
    width: 250,
  },
  content: {
    gap: 18,
    paddingBottom: 44,
    paddingHorizontal: 20,
    paddingTop: 18,
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
    top: 92,
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
    height: 300,
    opacity: 0.3,
    position: 'absolute',
    right: -120,
    top: -140,
    width: 300,
  },
});
