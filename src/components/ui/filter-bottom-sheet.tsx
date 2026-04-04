import type { PropsWithChildren, ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { createThemedStyles, type AppTheme } from '@/src/theme';

type FilterBottomSheetProps = PropsWithChildren<{
  actions?: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
  visible: boolean;
}>;

export function FilterBottomSheet({
  actions,
  children,
  description,
  onClose,
  title,
  visible,
}: FilterBottomSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>

          <View style={styles.content}>{children}</View>

          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actions: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  backdrop: {
    backgroundColor: theme.colors.glassSurface,
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    gap: theme.spacing.sm,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.textDim,
    textAlign: 'right',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: theme.spacing.sm,
    width: 42,
  },
  header: {
    gap: theme.spacing.xxs,
    marginBottom: theme.spacing.sm,
  },
  sheet: {
    backgroundColor: theme.colors.glassSurfaceStrong,
    borderColor: theme.colors.borderStrong,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
}));
