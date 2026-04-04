import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { DataRow } from '@/src/components/ui/data-row';
import { UserRegionalCouncilAssignmentField } from '@/src/features/auth/components/user-regional-council-assignment-field';
import { UserSettlementAssignmentField } from '@/src/features/auth/components/user-settlement-assignment-field';
import {
  assignableRoleOptions,
  getRoleLabel,
  requiresRegionalCouncilAssignment,
  requiresSettlementAssignment,
} from '@/src/features/auth/lib/permissions';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';
import type { ManagedUserProfile } from '@/src/features/auth/api/user-approval-service';
import type { LinkedSettlement, UserRole } from '@/src/types/database';

type ManagedUserAccessCardProps = {
  isSaving?: boolean;
  onSave: (payload: {
    regionalCouncils: string[];
    role: UserRole;
    settlementIds: string[];
  }) => void;
  regionalCouncilOptions: string[];
  settlementOptions: LinkedSettlement[];
  user: ManagedUserProfile;
};

export function ManagedUserAccessCard({
  isSaving = false,
  onSave,
  regionalCouncilOptions,
  settlementOptions,
  user,
}: ManagedUserAccessCardProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedRegionalCouncils, setSelectedRegionalCouncils] = useState<string[]>(
    user.linkedRegionalCouncils
  );
  const [selectedSettlementIds, setSelectedSettlementIds] = useState<string[]>(
    user.linkedSettlementIds
  );
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(user.role);
    setSelectedRegionalCouncils(user.linkedRegionalCouncils);
    setSelectedSettlementIds(user.linkedSettlementIds);
    setAssignmentError(null);
  }, [user]);

  useEffect(() => {
    if (
      !requiresSettlementAssignment(selectedRole) &&
      !requiresRegionalCouncilAssignment(selectedRole)
    ) {
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
          {assignableRoleOptions.map((option) => (
            <AppChip
              key={option.value}
              label={option.label}
              onPress={() => {
                setAssignmentError(null);
                setSelectedRole(option.value);
              }}
              selected={selectedRole === option.value}
              tone={selectedRole === option.value ? 'accent' : 'neutral'}
            />
          ))}
        </View>
      </View>

      {requiresSettlementAssignment(selectedRole) ? (
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

      {requiresRegionalCouncilAssignment(selectedRole) ? (
        <UserRegionalCouncilAssignmentField
          errorMessage={assignmentError ?? undefined}
          helperText="מחב״ל ומש״ק אשכול חייבים שיוך למועצה אזורית אחת לפחות."
          onToggleRegionalCouncil={(regionalCouncil) => {
            setAssignmentError(null);
            setSelectedRegionalCouncils((currentRegionalCouncils) =>
              currentRegionalCouncils.includes(regionalCouncil)
                ? currentRegionalCouncils.filter((item) => item !== regionalCouncil)
                : [...currentRegionalCouncils, regionalCouncil]
            );
          }}
          regionalCouncilOptions={regionalCouncilOptions}
          selectedRegionalCouncils={selectedRegionalCouncils}
        />
      ) : null}

      {!requiresSettlementAssignment(selectedRole) &&
      !requiresRegionalCouncilAssignment(selectedRole) &&
      (user.linkedSettlements.length || user.linkedRegionalCouncils.length) ? (
        <View style={styles.roleSection}>
          <Text style={styles.sectionLabel}>שיוכים קיימים</Text>

          {user.linkedRegionalCouncils.length ? (
            <View style={styles.roleChips}>
              {user.linkedRegionalCouncils.map((regionalCouncil) => (
                <AppChip key={regionalCouncil} label={regionalCouncil} selected tone="accent" />
              ))}
            </View>
          ) : null}

          {user.linkedSettlements.length ? (
            <View style={styles.roleChips}>
              {user.linkedSettlements.map((settlement) => (
                <AppChip key={settlement.id} label={settlement.name} selected tone="accent" />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <AppButton
        disabled={isSaving}
        label="שמירת הרשאות"
        loading={isSaving}
        onPress={() => {
          if (
            requiresSettlementAssignment(selectedRole) &&
            selectedSettlementIds.length === 0
          ) {
            setAssignmentError('יש לבחור לפחות יישוב אחד עבור משתמש משקב״ט');
            return;
          }

          if (
            requiresRegionalCouncilAssignment(selectedRole) &&
            selectedRegionalCouncils.length === 0
          ) {
            setAssignmentError('יש לבחור לפחות מועצה אזורית אחת עבור מחב״ל או מש״ק אשכול');
            return;
          }

          onSave({
            regionalCouncils: selectedRegionalCouncils,
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
