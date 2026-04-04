import type { UserRole } from '@/src/types/database';

type RoleScope = 'global' | 'plaga' | 'regional_councils' | 'settlements';

type RoleDefinition = {
  description: string;
  label: string;
  shortLabel: string;
  scope: RoleScope;
};

const roleDefinitions: Record<UserRole, RoleDefinition> = {
  super_admin: {
    description:
      'צפייה ועריכה מלאה במערכת, כולל ניהול יישובים, משתמשים, אימונים, משובים ורענון דירוגים.',
    label: 'מנהל מערכת',
    shortLabel: 'מנהל מערכת',
    scope: 'global',
  },
  instructor: {
    description:
      'צפייה מלאה במערכת ועריכת אימונים ומשובים, ללא ניהול משתמשים או יישובים.',
    label: 'מדריך',
    shortLabel: 'מדריך',
    scope: 'global',
  },
  machbal: {
    description:
      'צפייה בכל היישובים והדירוגים, ובאימונים של המועצות האזוריות המשויכות בלבד.',
    label: 'מחב״ל',
    shortLabel: 'מחב״ל',
    scope: 'regional_councils',
  },
  eshkol_officer: {
    description:
      'צפייה בכל היישובים והדירוגים, ובאימונים של המועצות האזוריות המשויכות בלבד.',
    label: 'מש״ק אשכול',
    shortLabel: 'מש״ק אשכול',
    scope: 'regional_councils',
  },
  mashkabat: {
    description:
      'צפייה בכל היישובים והדירוגים, ובאימונים של היישובים המשויכים בלבד. ניתן לשייך יותר מיישוב אחד.',
    label: 'משקב״ט',
    shortLabel: 'משקב״ט',
    scope: 'settlements',
  },
  mepag: {
    description:
      'צפייה בנתוני הפלגה המשויכת בלבד, ללא הרשאות עריכה, ניהול משתמשים או ניהול יישובים.',
    label: 'מפל״ג',
    shortLabel: 'מפל״ג',
    scope: 'plaga',
  },
  samepag: {
    description:
      'צפייה בנתוני הפלגה המשויכת בלבד, ללא הרשאות עריכה, ניהול משתמשים או ניהול יישובים.',
    label: 'סמפל״ג',
    shortLabel: 'סמפל״ג',
    scope: 'plaga',
  },
  razar: {
    description: 'צפייה מלאה ביישובים, דירוגים, אימונים ומשובים, ללא הרשאות עריכה.',
    label: 'רז״ר',
    shortLabel: 'רז״ר',
    scope: 'global',
  },
  sarazar: {
    description: 'צפייה מלאה ביישובים, דירוגים, אימונים ומשובים, ללא הרשאות עריכה.',
    label: 'סרז״ר',
    shortLabel: 'סרז״ר',
    scope: 'global',
  },
};

export const allUserRoles: UserRole[] = [
  'super_admin',
  'instructor',
  'machbal',
  'eshkol_officer',
  'mashkabat',
  'mepag',
  'samepag',
  'razar',
  'sarazar',
];

export const registrationRoleOptions = allUserRoles.map((role) => ({
  description: roleDefinitions[role].description,
  label: roleDefinitions[role].label,
  value: role,
}));

export const assignableRoleOptions = allUserRoles.map((role) => ({
  label: roleDefinitions[role].shortLabel,
  value: role,
}));

export function isSuperAdmin(role: UserRole | null) {
  return role === 'super_admin';
}

export function isInstructor(role: UserRole | null) {
  return role === 'instructor';
}

export function isMachbal(role: UserRole | null) {
  return role === 'machbal';
}

export function isEshkolOfficer(role: UserRole | null) {
  return role === 'eshkol_officer';
}

export function isMashkabat(role: UserRole | null) {
  return role === 'mashkabat';
}

export function isRazar(role: UserRole | null) {
  return role === 'razar';
}

export function isSarazar(role: UserRole | null) {
  return role === 'sarazar';
}

export function isMepag(role: UserRole | null) {
  return role === 'mepag';
}

export function isSamepag(role: UserRole | null) {
  return role === 'samepag';
}

export function isPlagaScopedRole(role: UserRole | null) {
  return isMepag(role) || isSamepag(role);
}

export function isCouncilScopedRole(role: UserRole | null) {
  return isMachbal(role) || isEshkolOfficer(role);
}

export function isSettlementScopedRole(role: UserRole | null) {
  return isMashkabat(role);
}

export function requiresRegionalCouncilAssignment(role: UserRole | null) {
  return isCouncilScopedRole(role);
}

export function requiresSettlementAssignment(role: UserRole | null) {
  return isSettlementScopedRole(role);
}

export function requiresPlagaAssignment(role: UserRole | null) {
  return isPlagaScopedRole(role);
}

export function canManageOperationalData(role: UserRole | null) {
  return isSuperAdmin(role) || isInstructor(role);
}

export function canCreateTrainings(role: UserRole | null) {
  return canManageOperationalData(role);
}

export function canCreateFeedbacks(role: UserRole | null) {
  return canManageOperationalData(role);
}

export function canManageSettlements(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function canManageUserApprovals(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function canManageTrainings(role: UserRole | null) {
  return canManageOperationalData(role);
}

export function canSyncRankings(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function getRoleLabel(role: UserRole | null) {
  if (!role) {
    return 'לא הוגדר';
  }

  return roleDefinitions[role]?.label ?? 'לא הוגדר';
}

export function getRoleShortLabel(role: UserRole | null) {
  if (!role) {
    return 'לא הוגדר';
  }

  return roleDefinitions[role]?.shortLabel ?? 'לא הוגדר';
}

export function getRoleDescription(role: UserRole | null) {
  if (!role) {
    return 'לא הוגדר';
  }

  return roleDefinitions[role]?.description ?? 'לא הוגדר';
}

export function getRoleScope(role: UserRole | null): RoleScope | null {
  if (!role) {
    return null;
  }

  return roleDefinitions[role]?.scope ?? null;
}
