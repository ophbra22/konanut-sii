import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { DataRow } from '@/src/components/ui/data-row';
import { UserPlagaAssignmentField } from '@/src/features/auth/components/user-plaga-assignment-field';
import { UserRegionalCouncilAssignmentField } from '@/src/features/auth/components/user-regional-council-assignment-field';
import { UserSettlementAssignmentField } from '@/src/features/auth/components/user-settlement-assignment-field';
import {
  assignableRoleOptions,
  getRoleLabel,
  requiresPlagaAssignment,
  requiresRegionalCouncilAssignment,
  requiresSettlementAssignment,
} from '@/src/features/auth/lib/permissions';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { rtlRow } from '@/src/lib/rtl';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';
import type { ManagedUserProfile } from '@/src/features/auth/api/user-approval-service';
import type { LinkedSettlement, UserRole } from '@/src/types/database';

type ManagedUserAccessCardProps = {
  canDelete?: boolean;
  isDeleting?: boolean;
  isSaving?: boolean;
  onDelete?: () => void;
  onSave: (payload: {
    assignedPlaga: string | null;
    fullName: string;
    regionalCouncils: string[];
    role: UserRole;
    settlementIds: string[];
  }) => void;
  plagaOptions: readonly string[];
  regionalCouncilOptions: string[];
  settlementOptions: LinkedSettlement[];
  user: ManagedUserProfile;
};

export function ManagedUserAccessCard({
  canDelete = false,
  isDeleting = false,
  isSaving = false,
  onDelete,
  onSave,
  plagaOptions,
  regionalCouncilOptions,
  settlementOptions,
  user,
}: ManagedUserAccessCardProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedPlaga, setSelectedPlaga] = useState<string | null>(
    user.assigned_plaga ?? null
  );
  const [selectedRegionalCouncils, setSelectedRegionalCouncils] = useState<string[]>(
    user.linkedRegionalCouncils
  );
  const [selectedSettlementIds, setSelectedSettlementIds] = useState<string[]>(
    user.linkedSettlementIds
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const displayName = fullName.trim() || user.full_name;

  useEffect(() => {
    setFullName(user.full_name);
    setSelectedRole(user.role);
    setSelectedPlaga(user.assigned_plaga ?? null);
    setSelectedRegionalCouncils(user.linkedRegionalCouncils);
    setSelectedSettlementIds(user.linkedSettlementIds);
    setNameError(null);
    setAssignmentError(null);
  }, [user]);

  useEffect(() => {
    if (
      !requiresPlagaAssignment(selectedRole) &&
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
          {user.assigned_plaga ? (
            <AppBadge label={`פלגה: ${user.assigned_plaga}`} size="sm" tone="neutral" />
          ) : null}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {displayName}
        </Text>
      </View>

      <View style={styles.details}>
        <DataRow label="דוא״ל" value={user.email?.trim() || 'לא הוגדר'} />
        <DataRow label="טלפון" value={user.phone?.trim() || 'לא הוגדר'} />
        {user.assigned_plaga ? <DataRow label="פלגה" value={user.assigned_plaga} /> : null}
        <DataRow label="נוצר" value={formatDisplayDate(user.created_at)} />
      </View>

      <AppTextField
        errorMessage={nameError ?? undefined}
        label="שם משתמש"
        onChangeText={(value) => {
          setNameError(null);
          setFullName(value);
        }}
        placeholder="שם מלא"
        returnKeyType="done"
        value={fullName}
      />

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

      {requiresPlagaAssignment(selectedRole) ? (
        <UserPlagaAssignmentField
          errorMessage={assignmentError ?? undefined}
          helperText="למפל״ג ולסמפל״ג חייבת להיות פלגה משויכת אחת."
          onSelectPlaga={(plaga) => {
            setAssignmentError(null);
            setSelectedPlaga(plaga);
          }}
          plagaOptions={plagaOptions}
          selectedPlaga={selectedPlaga}
        />
      ) : null}

      {requiresRegionalCouncilAssignment(selectedRole) ? (
        <UserRegionalCouncilAssignmentField
          errorMessage={assignmentError ?? undefined}
          helperText="מחב״ל ומש״ק מועצה חייבים שיוך למועצה אזורית אחת לפחות."
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
      !requiresPlagaAssignment(selectedRole) &&
      !requiresRegionalCouncilAssignment(selectedRole) &&
      (user.linkedSettlements.length ||
        user.linkedRegionalCouncils.length ||
        Boolean(user.assigned_plaga)) ? (
        <View style={styles.roleSection}>
          <Text style={styles.sectionLabel}>שיוכים קיימים</Text>

          {user.assigned_plaga ? (
            <View style={styles.roleChips}>
              <AppChip label={user.assigned_plaga} selected tone="accent" />
            </View>
          ) : null}

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
        disabled={isSaving || isDeleting}
        label="שמירת הרשאות"
        loading={isSaving}
        onPress={() => {
          const normalizedFullName = fullName.trim();

          if (normalizedFullName.length < 2) {
            setNameError('יש להזין שם משתמש');
            return;
          }

          if (
            requiresPlagaAssignment(selectedRole) &&
            !selectedPlaga
          ) {
            setAssignmentError('יש לבחור פלגה עבור מפל״ג או סמפל״ג');
            return;
          }

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
            setAssignmentError('יש לבחור לפחות מועצה אזורית אחת עבור מחב״ל או מש״ק מועצה');
            return;
          }

          onSave({
            assignedPlaga: requiresPlagaAssignment(selectedRole) ? selectedPlaga : null,
            fullName: normalizedFullName,
            regionalCouncils: selectedRegionalCouncils,
            role: selectedRole,
            settlementIds: selectedSettlementIds,
          });
        }}
        variant="secondary"
      />

      {canDelete && onDelete ? (
        <AppButton
          disabled={isSaving || isDeleting}
          label="מחק משתמש"
          loading={isDeleting}
          onPress={onDelete}
          variant="danger"
        />
      ) : null}
    </AppCard>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  badges: {
    ...rtlRow,
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
    ...rtlRow,
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  roleChips: {
    ...rtlRow,
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
}));
