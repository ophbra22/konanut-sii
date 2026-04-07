import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FileText, Presentation, SquarePen, Video } from 'lucide-react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { getProfessionalContentTypeLabel } from '@/src/features/professional-content/constants';
import type { ProfessionalContentListItem } from '@/src/features/professional-content/api/professional-content-service';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type ProfessionalContentCardProps = {
  canManage: boolean;
  content: ProfessionalContentListItem;
  onEdit?: () => void;
  onOpen: () => void;
};

function getContentIcon(type: ProfessionalContentListItem['content_type']): ComponentType<{
  color: string;
  size: number;
}> {
  switch (type) {
    case 'video':
      return Video;
    case 'presentation':
      return Presentation;
    default:
      return FileText;
  }
}

function getContentTone(type: ProfessionalContentListItem['content_type']) {
  switch (type) {
    case 'video':
      return 'danger' as const;
    case 'presentation':
      return 'warning' as const;
    default:
      return 'info' as const;
  }
}

function getDescription(description: string | null) {
  const value = description?.trim();
  return value ? value : 'ללא תיאור נוסף.';
}

function getOpenActionLabel(type: ProfessionalContentListItem['content_type']) {
  return type === 'document' ? 'פתיחה' : 'צפייה';
}

function getContentIconColor(tone: ReturnType<typeof getContentTone>) {
  switch (tone) {
    case 'danger':
      return theme.colors.danger;
    case 'warning':
      return theme.colors.warning;
    default:
      return theme.colors.info;
  }
}

export function ProfessionalContentCard({
  canManage,
  content,
  onEdit,
  onOpen,
}: ProfessionalContentCardProps) {
  const Icon = getContentIcon(content.content_type);
  const tone = getContentTone(content.content_type);
  const topic = content.topic?.trim() || 'ללא נושא מוגדר';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      <AppCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconShell, iconShellToneStyles[tone]]}>
            <Icon color={getContentIconColor(tone)} size={18} />
          </View>

          <View style={styles.textBlock}>
            <Text numberOfLines={1} style={styles.title}>
              {content.title}
            </Text>

            <Text numberOfLines={2} style={styles.description}>
              {getDescription(content.description)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.badgesRow}>
            {!content.is_active ? (
              <AppBadge label="לא פעיל" size="sm" tone="warning" />
            ) : null}
            <AppBadge
              label={getProfessionalContentTypeLabel(content.content_type)}
              size="sm"
              tone={tone}
            />
          </View>

          <View style={styles.topicPill}>
            <Text numberOfLines={1} style={styles.topic}>
              {topic}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            fullWidth={false}
            label={getOpenActionLabel(content.content_type)}
            onPress={onOpen}
            size="sm"
            style={styles.primaryAction}
          />

          {canManage && onEdit ? (
            <Pressable
              accessibilityRole="button"
              onPress={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              style={({ pressed }) => [styles.manageLink, pressed ? styles.manageLinkPressed : null]}
            >
              <SquarePen color={theme.colors.textMuted} size={14} />
              <Text style={styles.manageLinkText}>עריכה</Text>
            </Pressable>
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'flex-start',
  },
  badgesRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  card: {
    gap: 12,
    minHeight: 148,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    lineHeight: 16,
    textAlign: 'right',
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  manageLink: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  manageLinkPressed: {
    opacity: 0.74,
  },
  manageLinkText: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  pressable: {
    borderRadius: theme.radius.xl,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
  primaryAction: {
    minWidth: 88,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  topic: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  topicPill: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: '58%',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
}));

const iconShellToneStyles = createThemedStyles((theme: AppTheme) => ({
  danger: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  info: {
    backgroundColor: theme.colors.surfaceInfo,
    borderColor: theme.colors.infoBorder,
  },
  neutral: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
  },
}));
