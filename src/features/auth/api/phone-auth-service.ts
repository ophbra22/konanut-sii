import { supabase } from '@/src/lib/supabase';
import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import type { Json, UserRole } from '@/src/types/database';

export type RegistrationOptions = {
  councils: Array<{
    id: string;
    name: string;
    plaga_name: string;
  }>;
  settlements: Array<{
    council_id: string | null;
    id: string;
    name: string;
    regional_council: string | null;
  }>;
};

export type CompletePhoneRegistrationPayload = {
  fullName: string;
  requestedCouncilId?: string | null;
  requestedPlagaId?: string | null;
  requestedRole: UserRole;
  requestedSettlementId?: string | null;
};

const ISRAELI_MOBILE_PHONE_REGEX = /^\+9725\d{8}$/;
export const SYSTEM_ADMIN_PHONE = '+972545246426';

export function normalizeIsraeliPhoneNumber(value: string) {
  const compact = value
    .trim()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/[^\d+]/g, '');
  let normalized = compact;

  if (normalized.startsWith('+9720')) {
    normalized = `+972${normalized.slice(5)}`;
  } else if (normalized.startsWith('9720')) {
    normalized = `+972${normalized.slice(4)}`;
  } else if (normalized.startsWith('+972')) {
    normalized = normalized;
  } else if (normalized.startsWith('972')) {
    normalized = `+${normalized}`;
  } else if (/^05\d{8}$/.test(normalized)) {
    normalized = `+972${normalized.slice(1)}`;
  } else if (/^5\d{8}$/.test(normalized)) {
    normalized = `+972${normalized}`;
  }

  const isValid = ISRAELI_MOBILE_PHONE_REGEX.test(normalized);

  if (isValid) {
    return normalized;
  }

  throw new Error('מספר טלפון לא תקין');
}

export function translatePhoneAuthError(error: unknown, fallback: string) {
  const message = getErrorMessage(error, '');

  if (!message) {
    return fallback;
  }

  if (
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('Load failed')
  ) {
    return 'אין חיבור לשרת האימות. בדוק חיבור אינטרנט או הגדרות Supabase.';
  }

  if (
    message.includes('Token has expired') ||
    message.includes('invalid') ||
    message.includes('otp') ||
    message.includes('Token')
  ) {
    return 'הקוד שגוי או פג תוקף';
  }

  if (message.includes('rate') || message.includes('too many')) {
    return 'נשלחו יותר מדי בקשות. נסו שוב בעוד דקה';
  }

  if (message.includes('phone')) {
    return 'מספר טלפון לא תקין';
  }

  return fallback;
}

export async function sendPhoneOtp(phone: string) {
  const normalizedPhone = normalizeIsraeliPhoneNumber(phone);

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error(translatePhoneAuthError(error, 'לא ניתן לשלוח בקשת אימות כעת'));
  }

  return normalizedPhone;
}

export async function verifyPhoneOtp(params: {
  phone: string;
  token: string;
}) {
  const normalizedPhone = normalizeIsraeliPhoneNumber(params.phone);
  const token = params.token.trim();

  if (!/^\d{4,8}$/.test(token)) {
    throw new Error('הקוד שגוי או פג תוקף');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token,
    type: 'sms',
  });

  if (error) {
    throw new Error(translatePhoneAuthError(error, 'הקוד שגוי או פג תוקף'));
  }

  return data.session ?? null;
}

function mapRegistrationOptions(value: Json | null): RegistrationOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { councils: [], settlements: [] };
  }

  const options = value as {
    councils?: RegistrationOptions['councils'];
    settlements?: RegistrationOptions['settlements'];
  };

  return {
    councils: Array.isArray(options.councils) ? options.councils : [],
    settlements: Array.isArray(options.settlements) ? options.settlements : [],
  };
}

export async function listPhoneRegistrationOptions(): Promise<RegistrationOptions> {
  const { data, error } = await supabase.rpc('list_phone_registration_options');

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את אפשרויות ההרשמה');
  }

  return mapRegistrationOptions(data as Json | null);
}

export async function completePhoneRegistration(
  payload: CompletePhoneRegistrationPayload
) {
  const { error } = await supabase.rpc('complete_phone_registration', {
    requested_council_id_input: payload.requestedCouncilId ?? null,
    requested_plaga_id_input: payload.requestedPlagaId ?? null,
    requested_role_input: payload.requestedRole,
    requested_settlement_id_input: payload.requestedSettlementId ?? null,
    user_full_name: payload.fullName.trim(),
  });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן להשלים את בקשת ההרשמה');
  }
}
