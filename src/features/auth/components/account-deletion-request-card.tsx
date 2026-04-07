import { Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { DataRow } from '@/src/components/ui/data-row';
import { getRoleLabel } from '@/src/features/auth/lib/permissions';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { createThemedStyles, type AppTheme } from '@/src/theme';
import type { UserProfile } from '@/src/types/database';

type AccountDeletionRequestCardProps = {
  isDeleting?: boolean;
  onDelete: () => void;
  user: UserProfile;
};

export function AccountDeletionRequestCard({
  isDeleting = false,
  onDelete,
  user,
}: AccountDeletionRequestCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badges}>
          <AppBadge label="בקשת מחיקה" size="sm" tone="warning" />
          <AppBadge label={getRoleLabel(user.role)} size="sm" tone="info" />
          {user.assigned_plaga ? (
            <AppBadge label={`פלגה: ${user.assigned_plaga}`} size="sm" tone="neutral" />
          ) : null}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {user.full_name}
        </Text>
      </View>

      <View style={styles.details}>
        <DataRow label="דוא״ל" value={user.email?.trim() || 'לא הוגדר'} />
        <DataRow label="טלפון" value={user.phone?.trim() || 'לא הוגדר'} />
        <DataRow
          label="נשלחה בקשה"
          value={
            user.deletion_requested_at
              ? formatDisplayDate(user.deletion_requested_at)
              : 'לא ידוע'
          }
        />
      </View>

      <Text style={styles.helperText}>
        המשתמש ביקש למחוק את החשבון. הגישה לאפליקציה כבר נחסמה עד להשלמת הטיפול
        המנהלי.
      </Text>

      <View style={styles.actions}>
        <AppButton
          disabled={isDeleting}
          fullWidth={false}
          label="מחיקת משתמש"
          loading={isDeleting}
          onPress={onDelete}
          style={styles.actionButton}
          variant="danger"
        />
      </View>
    </AppCard>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actionButton: {
    minWidth: 140,
  },
  actions: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
  },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  card: {
    gap: theme.spacing.sm,
  },
  details: {
    gap: theme.spacing.xs,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
}));
