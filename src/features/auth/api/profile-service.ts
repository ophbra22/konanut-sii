import { supabase } from '@/src/lib/supabase';
import { createDataAccessError } from '@/src/lib/error-utils';
import type { AuthProfile } from '@/src/types/database';

function getAuthErrorMessage(message: string) {
  if (message.includes('Invalid login credentials')) {
    return 'פרטי ההתחברות אינם נכונים';
  }

  if (message.includes('Email not confirmed')) {
    return 'יש לאשר את כתובת הדוא"ל לפני הכניסה';
  }

  if (message.includes('network')) {
    return 'נראה שיש בעיית תקשורת. נסו שוב בעוד רגע';
  }

  return message;
}

export function translateAuthError(error: unknown) {
  const fallback = 'לא ניתן להשלים את פעולת ההתחברות כרגע';

  if (error instanceof Error) {
    return getAuthErrorMessage(error.message || fallback);
  }

  return fallback;
}

export async function fetchUserProfile(userId: string): Promise<AuthProfile | null> {
  const [{ data: profile, error: profileError }, { data: links, error: linksError }] =
    await Promise.all([
      supabase
        .from('users_profile')
        .select('id, full_name, email, phone, role, is_active, created_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_settlements')
        .select('settlement_id')
        .eq('user_id', userId),
    ]);

  if (profileError) {
    throw createDataAccessError(profileError, 'לא ניתן לטעון את פרופיל המשתמש');
  }

  if (linksError) {
    throw createDataAccessError(linksError, 'לא ניתן לטעון את שיוכי היישובים');
  }

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    linkedSettlementIds: (links ?? []).map((item) => item.settlement_id),
  };
}
