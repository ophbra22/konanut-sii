import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type { Json, UserRole } from '@/src/types/database';
import {
  MIN_PASSWORD_LENGTH,
  getPasswordMinLengthMessage,
  isValidEmailOtpToken,
} from '@/src/features/auth/lib/auth-constants';

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

export type CompleteEmailRegistrationPayload = {
  fullName: string;
  requestedCouncilId?: string | null;
  requestedPlagaId?: string | null;
  requestedRole: UserRole;
  requestedSettlementId?: string | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SYSTEM_ADMIN_EMAIL = 'ophbra22@gmail.com';

export function normalizeEmailAddress(value: string) {
  const normalizedEmail = value.trim().toLowerCase();

  if (EMAIL_REGEX.test(normalizedEmail)) {
    return normalizedEmail;
  }

  throw new Error('כתובת אימייל לא תקינה');
}

export function translateEmailOtpError(error: unknown, fallback: string) {
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

  if (message.includes('User already registered')) {
    return 'כבר קיים חשבון עם כתובת האימייל הזו';
  }

  if (
    message.includes('Signups not allowed') ||
    message.includes('signup is disabled') ||
    message.includes('Unable to sign in')
  ) {
    return 'לא נמצא חשבון פעיל עם כתובת האימייל הזו. אם אין לך חשבון, יש להגיש בקשת הרשמה.';
  }

  if (message.includes('Password should be at least')) {
    return getPasswordMinLengthMessage();
  }

  if (message.includes('rate') || message.includes('too many')) {
    return 'נשלחו יותר מדי בקשות. נסו שוב בעוד דקה';
  }

  if (message.includes('email')) {
    return 'כתובת אימייל לא תקינה';
  }

  return fallback;
}

function translatePasswordSetupError(error: unknown, fallback: string) {
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
    message.includes('Password should be at least') ||
    message.includes('Password is too short')
  ) {
    return getPasswordMinLengthMessage();
  }

  if (
    message.includes('New password should be different from the old password') ||
    message.includes('same password')
  ) {
    return 'יש לבחור סיסמה חדשה ושונה מהקודמת';
  }

  if (message.includes('Auth session missing')) {
    return 'יש להשלים תחילה את אימות המייל לפני הגדרת הסיסמה';
  }

  return fallback;
}

export async function sendEmailOtp(
  email: string,
  options: { shouldCreateUser?: boolean } = {}
) {
  const normalizedEmail = normalizeEmailAddress(email);
  const shouldCreateUser = options.shouldCreateUser ?? true;

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error(translateEmailOtpError(error, 'לא ניתן לשלוח בקשת אימות כעת'));
  }

  return normalizedEmail;
}

export async function verifyEmailOtp(params: {
  email: string;
  token: string;
}) {
  const normalizedEmail = normalizeEmailAddress(params.email);
  const token = params.token.trim();

  if (!isValidEmailOtpToken(token)) {
    throw new Error('הקוד שגוי או פג תוקף');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: 'email',
  });

  if (error) {
    throw new Error(translateEmailOtpError(error, 'הקוד שגוי או פג תוקף'));
  }

  return data.session ?? null;
}

export async function setAuthenticatedUserPassword(password: string) {
  const normalizedPassword = password.trim();

  if (normalizedPassword.length === 0) {
    throw new Error('יש לבחור סיסמה');
  }

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(getPasswordMinLengthMessage());
  }

  const { error } = await supabase.auth.updateUser({
    password: normalizedPassword,
  });

  if (error) {
    throw new Error(translatePasswordSetupError(error, 'לא ניתן לשמור את הסיסמה כעת'));
  }
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

export async function listEmailRegistrationOptions(): Promise<RegistrationOptions> {
  const { data, error } = await supabase.rpc('list_email_registration_options');

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את אפשרויות ההרשמה');
  }

  return mapRegistrationOptions(data as Json | null);
}

export async function completeEmailRegistration(
  payload: CompleteEmailRegistrationPayload
) {
  const { error } = await supabase.rpc('complete_email_registration', {
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
