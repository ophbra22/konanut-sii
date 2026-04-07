import { getErrorMessage } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import { translateAuthError } from '@/src/features/auth/api/profile-service';

const PASSWORD_RESET_REDIRECT_URL = 'konanut-sii://reset-password';
const handledRecoveryLinks = new Set<string>();

type PasswordRecoveryResult =
  | {
      handled: false;
    }
  | {
      handled: true;
      success: boolean;
      message?: string;
    };

function getPasswordResetErrorMessage(error: unknown, fallbackMessage: string) {
  const rawMessage = getErrorMessage(error, '').trim();

  if (!rawMessage) {
    return fallbackMessage;
  }

  if (
    /expired/i.test(rawMessage) ||
    /invalid/i.test(rawMessage) ||
    /otp/i.test(rawMessage) ||
    /token/i.test(rawMessage) ||
    /code verifier/i.test(rawMessage) ||
    /Auth session missing/i.test(rawMessage) ||
    /session_not_found/i.test(rawMessage)
  ) {
    return 'קישור איפוס הסיסמה אינו תקין או שפג תוקפו';
  }

  const translatedMessage = translateAuthError(error);

  if (translatedMessage === rawMessage && /[A-Za-z]/.test(rawMessage)) {
    return fallbackMessage;
  }

  return translatedMessage || fallbackMessage;
}

function getUrlMetadata(url: string) {
  const parsedUrl = new URL(url);
  const queryParams = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const mergedParams = new URLSearchParams();
  const rawSegments = [parsedUrl.host, ...parsedUrl.pathname.split('/')];
  const pathSegments = rawSegments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== '--');

  queryParams.forEach((value, key) => {
    mergedParams.set(key, value);
  });

  hashParams.forEach((value, key) => {
    mergedParams.set(key, value);
  });

  return {
    isResetPasswordPath: pathSegments.includes('reset-password'),
    params: mergedParams,
  };
}

export function isPasswordRecoveryLink(url: string) {
  try {
    const { isResetPasswordPath, params } = getUrlMetadata(url);
    const recoveryType = params.get('type');

    return (
      isResetPasswordPath ||
      recoveryType === 'recovery' ||
      params.has('access_token') ||
      params.has('refresh_token') ||
      params.has('token_hash') ||
      params.has('code')
    );
  } catch {
    return false;
  }
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RESET_REDIRECT_URL,
  });

  if (error) {
    throw new Error(getPasswordResetErrorMessage(error, 'לא ניתן לשלוח בקשת איפוס כעת'));
  }
}

export async function consumePasswordRecoveryUrl(
  url: string
): Promise<PasswordRecoveryResult> {
  if (!isPasswordRecoveryLink(url)) {
    return { handled: false };
  }

  if (handledRecoveryLinks.has(url)) {
    return {
      handled: true,
      success: true,
    };
  }

  try {
    const { params } = getUrlMetadata(url);
    const authCode = params.get('code');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const tokenHash = params.get('token_hash');
    const recoveryType = params.get('type');

    if (authCode) {
      const { error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (error) {
        throw error;
      }
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }
    } else if (tokenHash && recoveryType === 'recovery') {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });

      if (error) {
        throw error;
      }
    } else {
      return {
        handled: true,
        message: 'קישור איפוס הסיסמה אינו תקין או שפג תוקפו',
        success: false,
      };
    }

    handledRecoveryLinks.add(url);

    return {
      handled: true,
      success: true,
    };
  } catch (error) {
    return {
      handled: true,
      message: getPasswordResetErrorMessage(
        error,
        'לא ניתן לאמת את קישור איפוס הסיסמה'
      ),
      success: false,
    };
  }
}

export async function updatePassword(nextPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: nextPassword,
  });

  if (error) {
    throw new Error(getPasswordResetErrorMessage(error, 'לא ניתן לעדכן את הסיסמה'));
  }
}

export async function signOutPasswordRecoverySession() {
  const { error } = await supabase.auth.signOut({
    scope: 'local',
  });

  if (error) {
    throw new Error('לא ניתן להשלים את סיום תהליך האיפוס');
  }
}
