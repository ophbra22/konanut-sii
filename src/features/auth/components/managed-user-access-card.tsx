import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { DataRow } from '@/src/components/ui/data-row';
import { UserSettlementAssignmentField } from '@/src/features/auth/components/user-settlement-assignment-field';
import { getRoleLabel } from '@/src/features/auth/lib/permissions';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';
import type { ManagedUserProfile } from '@/src/features/auth/api/user-approval-service';
import type {
  LinkedSettlement,
  UserRole,
} from '@/src/types/database';

type ManagedUserAccessCardProps = {
  isSaving?: boolean;
  onSave: (payload: { role: UserRole; settlementIds: string[] }) => void;
  settlementOptions: LinkedSettlement[];
  user: ManagedUserProfile;
};

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: 'צפייה', value: 'viewer' },
  { label: 'משקב״ט', value: 'mashkabat' },
  { label: 'מדריך', value: 'instructor' },
  { label: 'מנהל', value: 'super_admin' },
];

export function ManagedUserAccessCard({
  isSaving = false,
  onSave,
  settlementOptions,
  user,
}: ManagedUserAccessCardProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedSettlementIds, setSelectedSettlementIds] = useState<string[]>(
    user.linkedSettlementIds
  );
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(user.role);
    setSelectedSettlementIds(user.linkedSettlementIds);
    setAssignmentError(null);
  }, [user]);

  useEffect(() => {
    if (selectedRole !== 'mashkabat') {
      setAssignmentError(null);
    }
  }, [selectedRole]);

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badges}>
          <AppBadge label={user.is_active ? 'פעיל' : 'לא פעיל'} size="sm" tone="success" />
          <AppBadge label={getRoleLabel(user.role)} size="sm" tone="info" />
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {user.full_name}
        </Text>
      </View>

      <View style={styles.details}>
        <DataRow label="דוא״ל" value={user.email?.trim() || 'לא הוגדר'} />
        <DataRow label="טלפון" value={user.phone?.trim() || 'לא הוגדר'} />
        <DataRow label="נוצר" value={formatDisplayDate(user.created_at)} />
      </View>

      <View style={styles.roleSection}>
        <Text style={styles.sectionLabel}>תפקיד פעיל</Text>
        <View style={styles.roleChips}>
          {roleOptions.map((option) => (
            <AppChip
              key={option.value}
              label={option.label}
              onPress={() => {
                setSelectedRole(option.value);
              }}
              selected={selectedRole === option.value}
              tone={selectedRole === option.value ? 'accent' : 'neutral'}
            />
          ))}
        </View>
      </View>

      {selectedRole === 'mashkabat' ? (
        <UserSettlementAssignmentField
          errorMessage={assignmentError ?? undefined}
          helperText="השיוכים נשמרים ב־user_settlements ומאפשרים ניהול כמה יישובים לאותו משתמש."
          onToggleSettlement={(settlementId) => {
            setAssignmentError(null);
            setSelectedSettlementIds((currentIds) =>
              currentIds.includes(settlementId)
                ? currentIds.filter((id) => id !== settlementId)
                : [...currentIds, settlementId]
            );
          }}
          selectedSettlementIds={selectedSettlementIds}
          settlements={settlementOptions}
        />
      ) : user.linkedSettlements.length ? (
        <View style={styles.roleSection}>
          <Text style={styles.sectionLabel}>שיוכים קיימים</Text>
          <View style={styles.roleChips}>
            {user.linkedSettlements.map((settlement) => (
              <AppChip key={settlement.id} label={settlement.name} selected tone="accent" />
            ))}
          </View>
        </View>
      ) : null}

      <AppButton
        disabled={isSaving}
        label="שמירת הרשאות"
        loading={isSaving}
        onPress={() => {
          if (selectedRole === 'mashkabat' && selectedSettlementIds.length === 0) {
            setAssignmentError('יש לבחור לפחות יישוב אחד עבור משתמש משקב״ט');
            return;
          }

          onSave({
            role: selectedRole,
            settlementIds: selectedSettlementIds,
          });
        }}
        variant="secondary"
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
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
  roleChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  roleSection: {
    gap: theme.spacing.xs,
  },
  sectionLabel: {
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
});
