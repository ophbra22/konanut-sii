import { Text, View } from 'react-native';

import { createThemedStyles, type AppTheme } from '@/src/theme';

type AuthBrandHeroProps = {
  caption?: string;
  subtitle: string;
  title: string;
};

export function AuthBrandHero({
  caption = 'זרוע יישובים מג״ב דרום',
  subtitle,
  title,
}: AuthBrandHeroProps) {
  return (
    <View style={styles.wrapper}>
      <View pointerEvents="none" style={styles.glowPrimary} />
      <View pointerEvents="none" style={styles.glowSecondary} />
      <View pointerEvents="none" style={styles.glowCore} />

      <View style={styles.content}>
        <Text style={styles.caption}>{caption}</Text>
        <View style={styles.titleWrap}>
          <View pointerEvents="none" style={styles.titleGlow} />
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  caption: {
    ...theme.typography.eyebrow,
    color: theme.colors.accentStrong,
    fontSize: 18,
    letterSpacing: 0.2,
    lineHeight: 22,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 384,
  },
  glowCore: {
    backgroundColor: theme.colors.glowMuted,
    borderRadius: 220,
    height: 176,
    opacity: 0.68,
    position: 'absolute',
    top: 10,
    width: 240,
  },
  glowPrimary: {
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 180,
    height: 156,
    opacity: 0.52,
    position: 'absolute',
    end: 18,
    top: -10,
    width: 164,
  },
  glowSecondary: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 160,
    bottom: -6,
    height: 120,
    opacity: 0.28,
    position: 'absolute',
    start: 32,
    width: 120,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    maxWidth: 320,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    fontSize: 27,
    lineHeight: 30,
    textAlign: 'center',
  },
  titleGlow: {
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 999,
    height: 82,
    opacity: 0.72,
    position: 'absolute',
    width: 228,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
    position: 'relative',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 132,
    overflow: 'hidden',
    paddingBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'relative',
  },
}));
