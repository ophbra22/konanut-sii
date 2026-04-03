import type { UserRole } from '@/src/types/database';

export function isSuperAdmin(role: UserRole | null) {
  return role === 'super_admin';
}

export function isViewer(role: UserRole | null) {
  return role === 'viewer';
}

export function canManageOperationalData(role: UserRole | null) {
  return isSuperAdmin(role);
}

export function getRoleLabel(role: UserRole | null) {
  switch (role) {
    case 'super_admin':
      return 'מנהל מערכת';
    case 'viewer':
      return 'צפייה מבוקרת';
    default:
      return 'לא הוגדר';
  }
}
