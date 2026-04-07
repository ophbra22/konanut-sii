import { useCallback } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { appReviewLinks } from '@/src/config/app-review-links';
import { createThemedStyles, type AppTheme } from '@/src/theme';

export function AuthUtilityLinks() {
  const openLink = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        return;
      }

      await Linking.openURL(url);
    } catch {
      // Ignore link failures in the auth footer and keep the flow uninterrupted.
    }
  }, []);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.securityText}>גישה מאובטחת • מערכת פנימית</Text>

      <View style={styles.linksRow}>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void openLink(appReviewLinks.supportUrl);
          }}
          style={({ pressed }) => [styles.link, pressed ? styles.linkPressed : null]}
        >
          <Text style={styles.linkText}>יצירת קשר</Text>
        </Pressable>

        <Text style={styles.separator}>•</Text>

        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void openLink(appReviewLinks.privacyPolicyUrl);
          }}
          style={({ pressed }) => [styles.link, pressed ? styles.linkPressed : null]}
        >
          <Text style={styles.linkText}>מדיניות פרטיות</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  link: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkPressed: {
    opacity: 0.72,
  },
  linkText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontWeight: '600',
    textAlign: 'center',
  },
  linksRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'center',
  },
  securityText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  separator: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  wrapper: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
  },
}));
