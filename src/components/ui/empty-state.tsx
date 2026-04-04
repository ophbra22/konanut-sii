import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { SurfaceCard, type SurfaceCardTone } from '@/src/components/ui/surface-card';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
  tone?: SurfaceCardTone;
};

export function EmptyState({
  actionLabel,
  description,
  onAction,
  title,
  tone = 'default',
}: EmptyStateProps) {
  return (
    <SurfaceCard style={styles.card} tone={tone}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {actionLabel && onAction ? (
        <AppButton
          fullWidth={false}
          label={actionLabel}
          onPress={onAction}
          style={styles.action}
          variant="secondary"
        />
      ) : null}
    </SurfaceCard>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  action: {
    alignSelf: 'flex-start',
    minWidth: 96,
  },
  card: {
    gap: theme.spacing.sm,
  },
  content: {
    gap: 4,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
}));
