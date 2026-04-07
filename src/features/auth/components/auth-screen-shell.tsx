import type { PropsWithChildren, ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import {
  createThemedStyles,
  type AppTheme,
  useAppTheme,
} from '@/src/theme';

type AuthScreenShellProps = PropsWithChildren<{
  badgeCaption?: string;
  badgeLabel: string;
  cardDescription: string;
  cardTitle: string;
  centerContent?: boolean;
  compact?: boolean;
  eyebrow?: string | null;
  footer?: ReactNode;
  headerAlign?: 'center' | 'right';
  hero?: ReactNode;
  scroll?: boolean;
  supportingText?: string;
  subtitle: string;
  title: string;
}>;

export function AuthScreenShell({
  badgeCaption,
  badgeLabel,
  cardDescription,
  cardTitle,
  centerContent = false,
  children,
  compact = false,
  eyebrow = 'כוננות שיא',
  footer,
  headerAlign = 'right',
  hero,
  scroll = true,
  supportingText,
  subtitle,
  title,
}: AuthScreenShellProps) {
  const appTheme = useAppTheme();
  const isCentered = headerAlign === 'center';

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={scroll}>
      <View style={styles.shell}>
        <View pointerEvents="none" style={styles.backgroundLayer}>
          <LinearGradient
            colors={[
              appTheme.colors.backgroundDeep,
              appTheme.colors.background,
              appTheme.colors.backgroundDeep,
              appTheme.colors.background,
            ]}
            end={{ x: 0.85, y: 1 }}
            start={{ x: 0.08, y: 0 }}
            style={styles.backgroundGradient}
          />
          <LinearGradient
            colors={[
              appTheme.colors.mediaGlow,
              appTheme.colors.glowMuted,
              'transparent',
            ]}
            end={{ x: 1, y: 0.95 }}
            start={{ x: 0, y: 0.05 }}
            style={styles.backgroundBand}
          />
          <View style={styles.backgroundAuraPrimary} />
          <View style={styles.backgroundAuraSecondary} />
          <View style={styles.backgroundAuraTertiary} />
          <View style={styles.backgroundAuraCenter} />
        </View>

        <View
          style={[
            styles.wrapper,
            compact ? styles.wrapperCompact : null,
            centerContent ? styles.wrapperCentered : null,
          ]}
        >
          {hero ? (
            <AppRevealView delay={20} style={styles.hero}>
              {hero}
            </AppRevealView>
          ) : null}

          <AppRevealView
            delay={85}
            style={[
              styles.header,
              compact ? styles.headerCompact : null,
              isCentered ? styles.headerCentered : null,
            ]}
          >
            {eyebrow ? (
              <Text style={[styles.eyebrow, isCentered ? styles.textCentered : null]}>
                {eyebrow}
              </Text>
            ) : null}
            <Text
              style={[
                styles.title,
                compact ? styles.titleCompact : null,
                isCentered ? styles.textCentered : null,
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                compact ? styles.subtitleCompact : null,
                isCentered ? styles.textCentered : null,
              ]}
            >
              {subtitle}
            </Text>
            {supportingText ? (
              <Text
                style={[
                  styles.supportingText,
                  compact ? styles.supportingTextCompact : null,
                  isCentered ? styles.textCentered : null,
                ]}
              >
                {supportingText}
              </Text>
            ) : null}
          </AppRevealView>

          <AppRevealView delay={145}>
            <View style={[styles.card, compact ? styles.cardCompact : null]}>
              <LinearGradient
                colors={[
                  appTheme.colors.infoSurface,
                  appTheme.colors.mediaGlow,
                  'transparent',
                ]}
                end={{ x: 0.2, y: 1 }}
                pointerEvents="none"
                start={{ x: 0.95, y: 0 }}
                style={styles.cardAccent}
              />
              <View pointerEvents="none" style={styles.cardTopEdge} />

              <View style={[styles.cardHeader, compact ? styles.cardHeaderCompact : null]}>
                <View
                  style={[
                    styles.cardBadgeBlock,
                    compact ? styles.cardBadgeBlockCompact : null,
                  ]}
                >
                  <View style={styles.cardBadge}>
                    <Shield color={appTheme.colors.info} size={14} strokeWidth={2.2} />
                    <Text style={styles.cardBadgeText}>{badgeLabel}</Text>
                  </View>
                  {badgeCaption ? (
                    <Text style={styles.cardBadgeCaption}>{badgeCaption}</Text>
                  ) : null}
                </View>

                <View style={[styles.cardHeading, compact ? styles.cardHeadingCompact : null]}>
                  <Text style={styles.cardTitle}>{cardTitle}</Text>
                  <Text style={styles.cardDescription}>{cardDescription}</Text>
                </View>
              </View>

              <View style={[styles.content, compact ? styles.contentCompact : null]}>
                {children}
              </View>

              {footer ? (
                <View style={[styles.footer, compact ? styles.footerCompact : null]}>{footer}</View>
              ) : null}
            </View>
          </AppRevealView>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  backgroundAuraPrimary: {
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 280,
    height: 300,
    opacity: 0.42,
    position: 'absolute',
    right: -120,
    top: -72,
    width: 300,
  },
  backgroundAuraSecondary: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 260,
    height: 220,
    left: -70,
    opacity: 0.24,
    position: 'absolute',
    top: 132,
    width: 220,
  },
  backgroundAuraCenter: {
    alignSelf: 'center',
    backgroundColor: theme.colors.mediaGlow,
    borderRadius: 260,
    height: 240,
    opacity: 0.34,
    position: 'absolute',
    top: 26,
    width: 280,
  },
  backgroundAuraTertiary: {
    backgroundColor: theme.colors.overlay,
    borderRadius: 260,
    bottom: 36,
    height: 180,
    opacity: 0.26,
    position: 'absolute',
    right: 18,
    width: 180,
  },
  backgroundBand: {
    height: 260,
    left: -40,
    opacity: 0.62,
    position: 'absolute',
    right: -40,
    top: 74,
    transform: [{ rotate: '-6deg' }],
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  card: {
    ...theme.elevation.card,
    backgroundColor: theme.colors.glassSurfaceStrong,
    borderColor: theme.colors.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    position: 'relative',
    width: '100%',
  },
  cardCompact: {
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardAccent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 112,
    left: 0,
    opacity: 0.78,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cardBadgeBlock: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cardBadgeBlockCompact: {
    gap: 4,
  },
  cardBadgeCaption: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  cardBadgeText: {
    ...theme.typography.meta,
    color: theme.colors.info,
    textAlign: 'right',
  },
  cardDescription: {
    ...theme.typography.body,
    color: theme.colors.textDim,
    lineHeight: 21,
    textAlign: 'right',
  },
  cardHeader: {
    gap: 12,
  },
  cardHeaderCompact: {
    gap: 9,
  },
  cardHeading: {
    gap: 7,
  },
  cardHeadingCompact: {
    gap: 5,
  },
  cardTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'right',
  },
  cardTopEdge: {
    backgroundColor: theme.colors.highlightOverlay,
    borderRadius: theme.radius.pill,
    height: 1,
    left: 22,
    opacity: 0.8,
    position: 'absolute',
    right: 22,
    top: 0,
  },
  content: {
    gap: theme.spacing.lg,
  },
  contentCompact: {
    gap: 14,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.colors.accentStrong,
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    borderTopColor: theme.colors.separatorStrong,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.md,
  },
  footerCompact: {
    gap: 6,
    paddingTop: 10,
  },
  headerCentered: {
    alignItems: 'center',
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
    gap: 4,
  },
  screenContent: {
    flexGrow: 1,
  },
  shell: {
    flex: 1,
    position: 'relative',
  },
  subtitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textSecondary,
    maxWidth: 500,
    textAlign: 'right',
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  supportingText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    lineHeight: 19,
    maxWidth: 470,
    textAlign: 'right',
  },
  supportingTextCompact: {
    lineHeight: 18,
  },
  textCentered: {
    textAlign: 'center',
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    fontSize: 37,
    lineHeight: 42,
    textAlign: 'right',
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 31,
  },
  wrapper: {
    alignSelf: 'center',
    gap: 24,
    maxWidth: 520,
    minHeight: '100%',
    paddingBottom: theme.spacing.xl,
    paddingTop: 22,
    width: '100%',
  },
  wrapperCompact: {
    gap: 12,
    paddingBottom: 10,
    paddingTop: 18,
  },
  wrapperCentered: {
    justifyContent: 'center',
  },
}));
