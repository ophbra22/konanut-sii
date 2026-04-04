import type { PropsWithChildren, ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/ui/app-screen';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type AuthScreenShellProps = PropsWithChildren<{
  badgeLabel: string;
  cardDescription: string;
  cardTitle: string;
  centerContent?: boolean;
  compact?: boolean;
  footer?: ReactNode;
  hero?: ReactNode;
  scroll?: boolean;
  subtitle: string;
  title: string;
}>;

export function AuthScreenShell({
  badgeLabel,
  cardDescription,
  cardTitle,
  centerContent = false,
  children,
  compact = false,
  footer,
  hero,
  scroll = true,
  subtitle,
  title,
}: AuthScreenShellProps) {
  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={scroll}>
      <View style={[styles.wrapper, centerContent ? styles.wrapperCentered : null]}>
        {hero ? <View style={styles.hero}>{hero}</View> : null}

        <View style={[styles.header, compact ? styles.headerCompact : null]}>
          <Text style={styles.eyebrow}>כוננות שיא</Text>
          <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text>
          <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>
            {subtitle}
          </Text>
        </View>

        <View style={[styles.card, compact ? styles.cardCompact : null]}>
          <LinearGradient
            colors={[
              theme.colors.infoSurface,
              theme.colors.mediaGlow,
              'transparent',
            ]}
            end={{ x: 0.15, y: 1 }}
            pointerEvents="none"
            start={{ x: 1, y: 0 }}
            style={styles.cardAccent}
          />

          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Shield color={theme.colors.info} size={14} strokeWidth={2.2} />
              <Text style={styles.cardBadgeText}>{badgeLabel}</Text>
            </View>

            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>{cardTitle}</Text>
              <Text style={styles.cardDescription}>{cardDescription}</Text>
            </View>
          </View>

          <View style={styles.content}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  card: {
    ...theme.elevation.card,
    backgroundColor: theme.colors.glassSurfaceStrong,
    borderColor: theme.colors.borderSoft,
    borderRadius: 28,
    borderWidth: 1,
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    position: 'relative',
    width: '100%',
  },
  cardCompact: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardAccent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 120,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cardBadge: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  cardBadgeText: {
    ...theme.typography.meta,
    color: theme.colors.info,
    textAlign: 'right',
  },
  cardDescription: {
    ...theme.typography.body,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  cardHeader: {
    gap: theme.spacing.md,
  },
  cardHeading: {
    gap: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    fontSize: 18,
    textAlign: 'right',
  },
  content: {
    gap: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  footer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: theme.spacing.lg,
  },
  hero: {
    width: '100%',
  },
  header: {
    gap: theme.spacing.sm,
    maxWidth: 520,
    width: '100%',
  },
  headerCompact: {
    gap: theme.spacing.xs,
  },
  screenContent: {
    flexGrow: 1,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textDim,
    maxWidth: 460,
    textAlign: 'right',
  },
  subtitleCompact: {
    ...theme.typography.caption,
    lineHeight: 18,
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'right',
  },
  titleCompact: {
    fontSize: 31,
    lineHeight: 35,
  },
  wrapper: {
    alignSelf: 'center',
    gap: theme.spacing.xxl,
    maxWidth: 520,
    minHeight: '100%',
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  wrapperCentered: {
    justifyContent: 'center',
  },
}));
