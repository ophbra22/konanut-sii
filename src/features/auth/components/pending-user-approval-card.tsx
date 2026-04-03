import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { DataRow } from '@/src/components/ui/data-row';
import { UserSettlementAssignmentField } from '@/src/features/auth/components/user-settlement-assignment-field';
import {
  getRoleLabel,
} from '@/src/features/auth/lib/permissions';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';
import type {
  LinkedSettlement,
  UserRole,
} from '@/src/types/database';
import type { PendingUserProfile } from '@/src/features/auth/api/user-approval-service';

type PendingUserApprovalCardProps = {
  isApproving?: boolean;
  isRejecting?: boolean;
  onApprove: (payload: { role: UserRole; settlementIds: string[] }) => void;
  onReject: () => void;
  settlementOptions: LinkedSettlement[];
  user: PendingUserProfile;
};

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: 'צפייה', value: 'viewer' },
  { label: 'משקב״ט', value: 'mashkabat' },
  { label: 'מדריך', value: 'instructor' },
  { label: 'מנהל', value: 'super_admin' },
];

function getDefaultRole(user: PendingUserProfile): UserRole {
  return user.requested_role ?? user.role ?? 'viewer';
}

function getStatusPresentation(user: PendingUserProfile) {
  if (user.requested_role) {
    return {
      label: 'ממתין לאישור',
      tone: 'warning' as const,
    };
  }

  return {
    label: 'לא פעיל',
    tone: 'neutral' as const,
  };
}

export function PendingUserApprovalCard({
  isApproving = false,
  isRejecting = false,
  onApprove,
  onReject,
  settlementOptions,
  user,
}: PendingUserApprovalCardProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => getDefaultRole(user));
  const [selectedSettlementIds, setSelectedSettlementIds] = useState<string[]>([]);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(getDefaultRole(user));
    setSelectedSettlementIds([]);
    setAssignmentError(null);
  }, [user]);

  useEffect(() => {
    if (selectedRole !== 'mashkabat') {
      setAssignmentError(null);
    }
  }, [selectedRole]);

  const status = getStatusPresentation(user);
  const requestedRoleLabel = useMemo(() => {
    if (!user.requested_role) {
      return 'ללא בקשה פעילה';
    }

    return `בקשה: ${getRoleLabel(user.requested_role)}`;
  }, [user.requested_role]);

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badges}>
          {user.requested_area?.trim() ? (
            <AppBadge label={`אזור: ${user.requested_area.trim()}`} size="sm" tone="neutral" />
          ) : null}
          <AppBadge label={requestedRoleLabel} size="sm" tone="info" />
          <AppBadge label={status.label} size="sm" tone={status.tone} />
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {user.full_name}
        </Text>
      </View>

      <View style={styles.details}>
        <DataRow label="דוא״ל" value={user.email?.trim() || 'לא הוגדר'} />
        <DataRow label="טלפון" value={user.phone?.trim() || 'לא הוגדר'} />
        <DataRow label="נרשם" value={formatDisplayDate(user.created_at)} />
      </View>

      <View style={styles.roleSection}>
        <Text style={styles.sectionLabel}>תפקיד באישור</Text>
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
          helperText="למשתמש משקב״ט חייב להיות לפחות שיוך אחד ליישוב."
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
      ) : null}

      <View style={styles.actions}>
        <AppButton
          disabled={isApproving || isRejecting}
          fullWidth={false}
          label="דחייה"
          loading={isRejecting}
          onPress={onReject}
          style={styles.actionButton}
          variant="danger"
        />
        <AppButton
          disabled={isApproving || isRejecting}
          fullWidth={false}
          label="אישור משתמש"
          loading={isApproving}
          onPress={() => {
            if (selectedRole === 'mashkabat' && selectedSettlementIds.length === 0) {
              setAssignmentError('יש לבחור לפחות יישוב אחד לפני אישור המשתמש');
              return;
            }

            onApprove({
              role: selectedRole,
              settlementIds: selectedSettlementIds,
            });
          }}
          style={styles.actionButton}
          variant="primary"
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'flex-start',
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
