import { supabase } from '@/src/lib/supabase';
import {
  requiresPlagaAssignment,
  requiresRegionalCouncilAssignment,
  requiresSettlementAssignment,
} from '@/src/features/auth/lib/permissions';
import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { isPlagaName, normalizePlagaName } from '@/src/lib/plaga';
import type {
  LinkedSettlement,
  UserProfile,
  UserRole,
} from '@/src/types/database';

export type PendingUserProfile = UserProfile;
export type ManagedUserProfile = UserProfile & {
  linkedRegionalCouncils: string[];
  linkedSettlementIds: string[];
  linkedSettlements: LinkedSettlement[];
};

const fullProfileSelect =
  'id, full_name, email, phone, requested_role, requested_area, assigned_plaga, deletion_requested_at, role, is_active, created_at';
const legacyProfileSelect = 'id, full_name, email, phone, role, is_active, created_at';
const deletionRequestedProfileSelect =
  'id, full_name, email, phone, assigned_plaga, deletion_requested_at, role, is_active, created_at';
const deletionRequestedLegacyProfileSelect =
  'id, full_name, email, phone, deletion_requested_at, role, is_active, created_at';
const settlementLinksSelect = `
  user_id,
  settlement:settlements (
    id,
    name,
    area,
    regional_council
  )
`;
const regionalCouncilLinksSelect = 'user_id, regional_council';

function shouldFallbackToLegacyProfileSelect(error: unknown) {
  const message = getErrorMessage(error, '');

  return (
    message.includes('requested_role') ||
    message.includes('requested_area') ||
    message.includes('assigned_plaga') ||
    message.includes('deletion_requested_at') ||
    message.includes('column') ||
    message.includes('schema cache')
  );
}

function shouldIgnoreRegionalCouncilLinksError(error: unknown) {
  const message = getErrorMessage(error, '');

  return (
    message.includes('user_regional_councils') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
}

function normalizeLegacyProfile<T extends {
  created_at: string;
  email: string | null;
  full_name: string;
  id: string;
  is_active: boolean;
  phone: string | null;
  role: UserRole;
}>(profile: T): PendingUserProfile {
  return {
    ...profile,
    assigned_plaga: null,
    deletion_requested_at: null,
    requested_area: null,
    requested_role: null,
  };
}

type SettlementLinkRow = {
  settlement: LinkedSettlement | null;
  user_id: string;
};

type RegionalCouncilLinkRow = {
  regional_council: string | null;
  user_id: string;
};

function normalizeSettlementIds(settlementIds: string[] | undefined) {
  return Array.from(new Set((settlementIds ?? []).filter(Boolean)));
}

function normalizeRegionalCouncilNames(regionalCouncils: string[] | undefined) {
  return Array.from(
    new Set(
      (regionalCouncils ?? [])
        .map((regionalCouncil) => regionalCouncil.trim())
        .filter(Boolean)
    )
  );
}

function assertAccessScopeSelection(params: {
  assignedPlaga: string | null;
  regionalCouncils: string[];
  role: UserRole;
  settlementIds: string[];
}) {
  if (requiresSettlementAssignment(params.role) && params.settlementIds.length === 0) {
    throw new Error('יש לבחור לפחות יישוב אחד עבור משתמש משקב״ט');
  }

  if (
    requiresRegionalCouncilAssignment(params.role) &&
    params.regionalCouncils.length === 0
  ) {
    throw new Error('יש לבחור לפחות מועצה אזורית אחת עבור מחב״ל או מש״ק אשכול');
  }

  if (requiresPlagaAssignment(params.role) && !params.assignedPlaga) {
    throw new Error('יש לבחור פלגה עבור מפל״ג או סמפל״ג');
  }
}

function normalizeAssignedPlaga(assignedPlaga: string | null | undefined) {
  const normalizedPlaga = normalizePlagaName(assignedPlaga);

  return isPlagaName(normalizedPlaga) ? normalizedPlaga : null;
}

function groupSettlementLinksByUserId(links: SettlementLinkRow[] | null | undefined) {
  const settlementMap = new Map<
    string,
    {
      linkedSettlementIds: string[];
      linkedSettlements: LinkedSettlement[];
    }
  >();

  (links ?? []).forEach((link) => {
    if (!link.settlement) {
      return;
    }

    const currentEntry = settlementMap.get(link.user_id) ?? {
      linkedSettlementIds: [],
      linkedSettlements: [],
    };

    currentEntry.linkedSettlementIds.push(link.settlement.id);
    currentEntry.linkedSettlements.push(link.settlement);
    settlementMap.set(link.user_id, currentEntry);
  });

  return settlementMap;
}

function groupRegionalCouncilsByUserId(
  links: RegionalCouncilLinkRow[] | null | undefined
) {
  const regionalCouncilsMap = new Map<string, string[]>();

  (links ?? []).forEach((link) => {
    const regionalCouncil = link.regional_council?.trim();

    if (!regionalCouncil) {
      return;
    }

    const currentRegionalCouncils = regionalCouncilsMap.get(link.user_id) ?? [];
    regionalCouncilsMap.set(link.user_id, [
      ...currentRegionalCouncils,
      regionalCouncil,
    ]);
  });

  return new Map(
    Array.from(regionalCouncilsMap.entries()).map(([userId, regionalCouncils]) => [
      userId,
      Array.from(new Set(regionalCouncils)),
    ])
  );
}

async function replaceUserSettlementAssignments(userId: string, settlementIds: string[]) {
  const normalizedSettlementIds = normalizeSettlementIds(settlementIds);

  const { error: deleteError } = await supabase
    .from('user_settlements')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw createDataAccessError(deleteError, 'לא ניתן לעדכן את שיוכי היישובים');
  }

  if (!normalizedSettlementIds.length) {
    return;
  }

  const { error: insertError } = await supabase.from('user_settlements').insert(
    normalizedSettlementIds.map((settlementId) => ({
      settlement_id: settlementId,
      user_id: userId,
    }))
  );

  if (insertError) {
    throw createDataAccessError(insertError, 'לא ניתן לשמור את שיוכי היישובים');
  }
}

async function replaceUserRegionalCouncilAssignments(
  userId: string,
  regionalCouncils: string[]
) {
  const normalizedRegionalCouncils = normalizeRegionalCouncilNames(regionalCouncils);

  const { error: deleteError } = await supabase
    .from('user_regional_councils')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw createDataAccessError(deleteError, 'לא ניתן לעדכן את שיוכי המועצות');
  }

  if (!normalizedRegionalCouncils.length) {
    return;
  }

  const { error: insertError } = await supabase.from('user_regional_councils').insert(
    normalizedRegionalCouncils.map((regionalCouncil) => ({
      regional_council: regionalCouncil,
      user_id: userId,
    }))
  );

  if (insertError) {
    throw createDataAccessError(insertError, 'לא ניתן לשמור את שיוכי המועצות');
  }
}

export async function listPendingUsers(): Promise<PendingUserProfile[]> {
  const { data, error } = await supabase
    .from('users_profile')
    .select(fullProfileSelect)
    .eq('is_active', false)
    .order('created_at', { ascending: false });

  if (error && shouldFallbackToLegacyProfileSelect(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from('users_profile')
      .select(legacyProfileSelect)
      .eq('is_active', false)
      .order('created_at', { ascending: false });

    if (legacyError) {
      throw createDataAccessError(legacyError, 'לא ניתן לטעון את המשתמשים הלא פעילים');
    }

    return (legacyData ?? []).map((item) => normalizeLegacyProfile(item));
  }

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את המשתמשים הלא פעילים');
  }

  return data ?? [];
}

export async function listDeletionRequestedUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users_profile')
    .select(deletionRequestedProfileSelect)
    .not('deletion_requested_at', 'is', null)
    .order('deletion_requested_at', { ascending: false });

  if (error && shouldFallbackToLegacyProfileSelect(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from('users_profile')
      .select(deletionRequestedLegacyProfileSelect)
      .not('deletion_requested_at', 'is', null)
      .order('deletion_requested_at', { ascending: false });

    if (legacyError) {
      throw createDataAccessError(legacyError, 'לא ניתן לטעון את בקשות מחיקת החשבון');
    }

    return (legacyData ?? []).map((item) => ({
      ...item,
      assigned_plaga: null,
      requested_area: null,
      requested_role: null,
    }));
  }

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את בקשות מחיקת החשבון');
  }

  return (data ?? []).map((item) => ({
    ...item,
    requested_area: null,
    requested_role: null,
  }));
}

export async function deleteRequestedUserAccount(userId: string) {
  const { error } = await supabase.rpc('admin_delete_requested_user_account', {
    target_user_id: userId,
  });

  if (!error) {
    return;
  }

  const message = getErrorMessage(error, '');

  if (message.includes('deletion_request_not_found')) {
    throw new Error('לא נמצאה בקשת מחיקת חשבון פעילה עבור המשתמש');
  }

  if (message.includes('cannot_delete_current_session')) {
    throw new Error('לא ניתן למחוק את החשבון שממנו את/ה מחובר/ת כרגע');
  }

  if (message.includes('not_authorized')) {
    throw new Error('אין לך הרשאה למחוק את החשבון הזה');
  }

  if (message.includes('profile_not_found')) {
    throw new Error('המשתמש כבר לא זמין למחיקה');
  }

  if (
    message.includes('admin_delete_requested_user_account') ||
    message.includes('function public.admin_delete_requested_user_account') ||
    message.includes('Could not find the function')
  ) {
    throw new Error(
      'פונקציית מחיקת המשתמש עדיין לא הותקנה בשרת. צריך להחיל את מיגרציית המחיקה ב-Supabase.'
    );
  }

  throw createDataAccessError(error, 'לא ניתן למחוק את המשתמש כרגע');
}

export async function approvePendingUser(params: {
  assignedPlaga?: string | null;
  regionalCouncils?: string[];
  role: UserRole;
  settlementIds?: string[];
  userId: string;
}) {
  const settlementIds = requiresSettlementAssignment(params.role)
    ? normalizeSettlementIds(params.settlementIds)
    : [];
  const regionalCouncils = requiresRegionalCouncilAssignment(params.role)
    ? normalizeRegionalCouncilNames(params.regionalCouncils)
    : [];
  const assignedPlaga = requiresPlagaAssignment(params.role)
    ? normalizeAssignedPlaga(params.assignedPlaga)
    : null;

  assertAccessScopeSelection({
    assignedPlaga,
    regionalCouncils,
    role: params.role,
    settlementIds,
  });

  const { error } = await supabase
    .from('users_profile')
    .update({
      assigned_plaga: assignedPlaga,
      is_active: true,
      requested_area: null,
      requested_role: null,
      role: params.role,
    })
    .eq('id', params.userId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לאשר את המשתמש');
  }

  await Promise.all([
    replaceUserSettlementAssignments(params.userId, settlementIds),
    replaceUserRegionalCouncilAssignments(params.userId, regionalCouncils),
  ]);
}

export async function rejectPendingUser(userId: string) {
  const { error } = await supabase
    .from('users_profile')
    .update({
      assigned_plaga: null,
      is_active: false,
      requested_area: null,
      requested_role: null,
    })
    .eq('id', userId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לדחות את המשתמש');
  }

  await Promise.all([
    replaceUserSettlementAssignments(userId, []),
    replaceUserRegionalCouncilAssignments(userId, []),
  ]);
}

export async function listManagedUsers(): Promise<ManagedUserProfile[]> {
  const { data: rawProfiles, error: profilesError } = await supabase
    .from('users_profile')
    .select(fullProfileSelect)
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  let profiles = rawProfiles as UserProfile[] | null;

  if (profilesError && shouldFallbackToLegacyProfileSelect(profilesError)) {
    const { data: legacyProfiles, error: legacyError } = await supabase
      .from('users_profile')
      .select(legacyProfileSelect)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (legacyError) {
      throw createDataAccessError(legacyError, 'לא ניתן לטעון את רשימת המשתמשים');
    }

    profiles = (legacyProfiles ?? []).map((item) => normalizeLegacyProfile(item));
  } else if (profilesError) {
    throw createDataAccessError(profilesError, 'לא ניתן לטעון את רשימת המשתמשים');
  }

  const userIds = (profiles ?? []).map((profile) => profile.id);

  if (!userIds.length) {
    return [];
  }

  const [
    { data: links, error: linksError },
    { data: regionalCouncilLinks, error: regionalCouncilLinksError },
  ] = await Promise.all([
    supabase
      .from('user_settlements')
      .select(settlementLinksSelect)
      .in('user_id', userIds),
    supabase
      .from('user_regional_councils')
      .select(regionalCouncilLinksSelect)
      .in('user_id', userIds),
  ]);

  if (linksError) {
    throw createDataAccessError(linksError, 'לא ניתן לטעון את שיוכי היישובים');
  }

  if (
    regionalCouncilLinksError &&
    !shouldIgnoreRegionalCouncilLinksError(regionalCouncilLinksError)
  ) {
    throw createDataAccessError(
      regionalCouncilLinksError,
      'לא ניתן לטעון את שיוכי המועצות'
    );
  }

  const linksByUserId = groupSettlementLinksByUserId((links ?? []) as SettlementLinkRow[]);
  const shouldIgnoreRegionalCouncilLinks = regionalCouncilLinksError
    ? shouldIgnoreRegionalCouncilLinksError(regionalCouncilLinksError)
    : false;
  const regionalCouncilsByUserId = groupRegionalCouncilsByUserId(
    shouldIgnoreRegionalCouncilLinks
      ? []
      : ((regionalCouncilLinks ?? []) as RegionalCouncilLinkRow[])
  );

  return (profiles ?? []).map((profile) => {
    const linkedSettlements = linksByUserId.get(profile.id) ?? {
      linkedSettlementIds: [],
      linkedSettlements: [],
    };
    const linkedRegionalCouncils = regionalCouncilsByUserId.get(profile.id) ?? [];

    return {
      ...profile,
      linkedRegionalCouncils,
      ...linkedSettlements,
    };
  });
}

export async function updateManagedUserAccess(params: {
  assignedPlaga?: string | null;
  regionalCouncils?: string[];
  role: UserRole;
  settlementIds?: string[];
  userId: string;
}) {
  const settlementIds = requiresSettlementAssignment(params.role)
    ? normalizeSettlementIds(params.settlementIds)
    : [];
  const regionalCouncils = requiresRegionalCouncilAssignment(params.role)
    ? normalizeRegionalCouncilNames(params.regionalCouncils)
    : [];
  const assignedPlaga = requiresPlagaAssignment(params.role)
    ? normalizeAssignedPlaga(params.assignedPlaga)
    : null;

  assertAccessScopeSelection({
    assignedPlaga,
    regionalCouncils,
    role: params.role,
    settlementIds,
  });

  const { error } = await supabase
    .from('users_profile')
    .update({
      assigned_plaga: assignedPlaga,
      role: params.role,
    })
    .eq('id', params.userId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לעדכן את הרשאות המשתמש');
  }

  await Promise.all([
    replaceUserSettlementAssignments(params.userId, settlementIds),
    replaceUserRegionalCouncilAssignments(params.userId, regionalCouncils),
  ]);
}
