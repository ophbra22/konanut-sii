import type { UserRole } from '@/src/types/database';

export function isSuperAdmin(role: UserRole | null) {
  return role === 'super_admin';
}

export function isInstructor(role: UserRole | null) {
  return role === 'instructor';
}

export function isMashkabat(role: UserRole | null) {
  return role === 'mashkabat';
}

export function isViewer(role: UserRole | null) {
  return role === 'viewer';
}

export function canManageOperationalData(role: UserRole | null) {
  return isSuperAdmin(role) || isInstructor(role);
}

export function canCreateTrainings(role: UserRole | null) {
  return isSuperAdmin(role) || isInstructor(role);
}

export function canCreateFeedbacks(role: UserRole | null) {
  return isSuperAdmin(role) || isInstructor(role);
}

export function canManageSettlements(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function canManageUserApprovals(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function canManageTrainings(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function canSyncRankings(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function getRoleLabel(role: UserRole | null) {
  switch (role) {
    case 'super_admin':
      return 'מנהל מערכת';
    case 'instructor':
      return 'מדריך';
    case 'mashkabat':
      return 'משקב״ט';
    case 'viewer':
      return 'צפייה מבוקרת';
    default:
      return 'לא הוגדר';
  }
}
