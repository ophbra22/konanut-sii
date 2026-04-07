import { supabase } from '@/src/lib/supabase';
import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import type {
  AuthProfile,
  LinkedSettlement,
  UserProfile,
} from '@/src/types/database';

const fullProfileSelect =
  'id, full_name, email, phone, requested_role, requested_area, assigned_plaga, deletion_requested_at, role, is_active, created_at';
const legacyProfileSelect = 'id, full_name, email, phone, role, is_active, created_at';
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
  role: UserProfile['role'];
}>(profile: T): UserProfile {
  return {
    ...profile,
    assigned_plaga: null,
    deletion_requested_at: null,
    requested_area: null,
    requested_role: null,
  };
}

function getAuthErrorMessage(message: string) {
  if (message.includes('Invalid login credentials')) {
    return 'כתובת הדוא"ל או הסיסמה שגויים. נסו שוב.';
  }

  if (message.includes('User already registered')) {
    return 'קיים כבר חשבון עם כתובת הדוא"ל הזו';
  }

  if (message.includes('Email not confirmed')) {
    return 'יש לאשר את כתובת הדוא"ל לפני הכניסה';
  }

  if (
    message.includes('Password should be at least') ||
    message.includes('Password is too short')
  ) {
    return 'יש לבחור סיסמה באורך 6 תווים לפחות';
  }

  if (
    message.includes('New password should be different from the old password') ||
    message.includes('same password')
  ) {
    return 'יש לבחור סיסמה חדשה ושונה מהקודמת';
  }

  if (
    message.includes('Auth session missing') ||
    message.includes('Email link is invalid or has expired') ||
    (message.includes('expired') && message.includes('link')) ||
    (message.includes('invalid') && message.includes('token'))
  ) {
    return 'קישור איפוס הסיסמה אינו תקין או שפג תוקפו';
  }

  if (
    message.includes('users_profile_role_check') ||
    message.includes('users_profile_requested_role_check') ||
    message.includes('users_profile_assigned_plaga_check') ||
    message.includes('user_regional_councils')
  ) {
    return 'נדרש לעדכן את סכמת ההרשאות ב-Supabase לפני השלמת הפעולה';
  }

  if (message.includes('Unable to validate email address')) {
    return 'יש להזין כתובת דוא"ל תקינה';
  }

  if (message.includes('Signup is disabled')) {
    return 'ההרשמה למערכת אינה זמינה כרגע';
  }

  if (message.includes('network')) {
    return 'נראה שיש בעיית תקשורת. נסו שוב בעוד רגע';
  }

  return message;
}

export function translateAuthError(error: unknown) {
  const fallback = 'לא ניתן להשלים את פעולת האימות כרגע';

  if (error instanceof Error) {
    return getAuthErrorMessage(error.message || fallback);
  }

  return fallback;
}

type SettlementLinkRow = {
  settlement: LinkedSettlement | null;
  user_id: string;
};

type RegionalCouncilLinkRow = {
  regional_council: string | null;
  user_id: string;
};

function mapSettlementLinks(links: SettlementLinkRow[] | null | undefined) {
  const linkedSettlements = (links ?? [])
    .map((item) => item.settlement)
    .filter((settlement): settlement is LinkedSettlement => Boolean(settlement));

  return {
    linkedSettlementIds: linkedSettlements.map((settlement) => settlement.id),
    linkedSettlements,
  };
}

function mapRegionalCouncilLinks(
  links: RegionalCouncilLinkRow[] | null | undefined
) {
  return {
    linkedRegionalCouncils: Array.from(
      new Set(
        (links ?? [])
          .map((item) => item.regional_council?.trim())
          .filter((regionalCouncil): regionalCouncil is string => Boolean(regionalCouncil))
      )
    ),
  };
}

export async function fetchUserProfile(userId: string): Promise<AuthProfile | null> {
  const [
    { data: rawProfile, error: profileError },
    { data: links, error: linksError },
    { data: regionalCouncilLinks, error: regionalCouncilLinksError },
  ] = await Promise.all([
    supabase
      .from('users_profile')
      .select(fullProfileSelect)
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_settlements')
      .select(settlementLinksSelect)
      .eq('user_id', userId),
    supabase
      .from('user_regional_councils')
      .select(regionalCouncilLinksSelect)
      .eq('user_id', userId),
  ]);

  let profile = rawProfile as UserProfile | null;

  if (profileError && shouldFallbackToLegacyProfileSelect(profileError)) {
    const { data: legacyProfile, error: legacyError } = await supabase
      .from('users_profile')
      .select(legacyProfileSelect)
      .eq('id', userId)
      .maybeSingle();

    if (legacyError) {
      throw createDataAccessError(legacyError, 'לא ניתן לטעון את פרופיל המשתמש');
    }

    profile = legacyProfile ? normalizeLegacyProfile(legacyProfile) : null;
  } else if (profileError) {
    throw createDataAccessError(profileError, 'לא ניתן לטעון את פרופיל המשתמש');
  }

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

  if (!profile) {
    return null;
  }

  const settlementLinks = mapSettlementLinks((links ?? []) as SettlementLinkRow[]);
  const shouldIgnoreRegionalCouncilLinks = regionalCouncilLinksError
    ? shouldIgnoreRegionalCouncilLinksError(regionalCouncilLinksError)
    : false;
  const regionalCouncils = mapRegionalCouncilLinks(
    shouldIgnoreRegionalCouncilLinks
      ? []
      : ((regionalCouncilLinks ?? []) as RegionalCouncilLinkRow[])
  );

  return {
    ...profile,
    ...regionalCouncils,
    ...settlementLinks,
  };
}

export async function listActiveProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users_profile')
    .select(fullProfileSelect)
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error && shouldFallbackToLegacyProfileSelect(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from('users_profile')
      .select(legacyProfileSelect)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (legacyError) {
      throw createDataAccessError(legacyError, 'לא ניתן לטעון את רשימת המשתמשים');
    }

    return (legacyData ?? []).map((item) => normalizeLegacyProfile(item));
  }

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את רשימת המשתמשים');
  }

  return data ?? [];
}

export async function requestAccountDeletion() {
  const { error } = await supabase.rpc('request_account_deletion');

  if (error) {
    throw createDataAccessError(
      error,
      'לא ניתן לשלוח את בקשת מחיקת החשבון כרגע'
    );
  }
}
