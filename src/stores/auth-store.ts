import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  deleteCurrentUserAccount,
  fetchUserProfile,
  translateAuthError,
} from '@/src/features/auth/api/profile-service';
import {
  completePhoneRegistration,
  sendPhoneOtp,
  verifyPhoneOtp,
  type CompletePhoneRegistrationPayload,
} from '@/src/features/auth/api/phone-auth-service';
import {
  completeEmailRegistration,
  normalizeEmailAddress,
  sendEmailOtp,
  setAuthenticatedUserPassword,
  verifyEmailOtp,
  type CompleteEmailRegistrationPayload,
} from '@/src/features/auth/api/email-auth-service';
import { getPresentableErrorMessage } from '@/src/lib/error-utils';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { supabase } from '@/src/lib/supabase';
import type { AuthProfile, UserRole } from '@/src/types/database';

type AuthStatus =
  | 'authenticated'
  | 'idle'
  | 'loading'
  | 'needs_registration'
  | 'unauthenticated';

type Credentials = {
  email: string;
  password: string;
};

type SignUpPayload = Credentials & {
  fullName: string;
  phone?: string;
  requestedRole: UserRole;
  settlementArea?: string;
};

type AuthActionResult = {
  message?: string;
  reason?:
    | 'inactive_account'
    | 'invalid_credentials'
    | 'needs_registration'
    | 'pending_approval'
    | 'rejected'
    | 'unknown';
  success: boolean;
};

type AuthState = {
  beginPasswordRecovery: () => void;
  clearError: () => void;
  clearPasswordRecoveryState: () => void;
  completeEmailRegistrationWithPassword: (
    payload: CompleteEmailRegistrationPayload & {
      password: string;
    }
  ) => Promise<AuthActionResult>;
  deleteAccount: () => Promise<AuthActionResult>;
  errorMessage: string | null;
  failPasswordRecovery: (message: string) => void;
  initialize: () => Promise<void>;
  isInitialized: boolean;
  isPasswordRecovery: boolean;
  linkedSettlementIds: string[];
  passwordRecoveryError: string | null;
  profile: AuthProfile | null;
  refreshProfile: () => Promise<void>;
  role: UserRole | null;
  sendEmailOtp: (email: string) => Promise<AuthActionResult & { email?: string }>;
  sendPhoneOtp: (phone: string) => Promise<AuthActionResult & { phone?: string }>;
  session: Session | null;
  signIn: (credentials: Credentials) => Promise<AuthActionResult>;
  signInWithEmailOtp: (params: {
    email: string;
    token: string;
  }) => Promise<AuthActionResult>;
  signInWithPhoneOtp: (params: {
    phone: string;
    token: string;
  }) => Promise<AuthActionResult>;
  signUp: (payload: SignUpPayload) => Promise<AuthActionResult>;
  completeEmailRegistration: (
    payload: CompleteEmailRegistrationPayload
  ) => Promise<AuthActionResult>;
  completePhoneRegistration: (
    payload: CompletePhoneRegistrationPayload
  ) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  status: AuthStatus;
  user: User | null;
};

let authSubscription: { unsubscribe: () => void } | null = null;
let initializePromise: Promise<void> | null = null;
let pendingRegistrationEmail: string | null = null;

function isProfileRegistrationIncomplete(profile: AuthProfile | null) {
  if (!profile) {
    return true;
  }

  return (
    profile.approval_status === 'pending_approval' &&
    !profile.requested_role
  );
}

function getApprovalStatus(profile: AuthProfile) {
  if (profile.approval_status) {
    return profile.approval_status;
  }

  return profile.is_active ? 'approved' : 'pending_approval';
}

export const useAuthStore = create<AuthState>((set, get) => {
  const applyUnauthenticatedState = (errorMessage: string | null = null) => {
    queryClient.clear();

    set({
      errorMessage,
      isInitialized: true,
      isPasswordRecovery: false,
      linkedSettlementIds: [],
      passwordRecoveryError: null,
      profile: null,
      role: null,
      session: null,
      status: 'unauthenticated',
      user: null,
    });
  };

  const applyAuthenticatedState = async (
    session: Session,
    options: { recovery?: boolean } = {}
  ) => {
    const isPasswordRecovery = options.recovery ?? false;
    const normalizedPendingRegistrationEmail = pendingRegistrationEmail?.toLowerCase() ?? null;
    const normalizedSessionEmail = session.user.email?.toLowerCase() ?? null;

    set((state) => ({
      ...state,
      errorMessage: null,
      session,
      status: 'loading',
      user: session.user,
    }));

    let profile: AuthProfile | null = null;

    try {
      profile = await fetchUserProfile(session.user.id);
    } catch (error) {
      if (!isPasswordRecovery) {
        throw error;
      }
    }

    if (!isPasswordRecovery) {
      if (!profile || isProfileRegistrationIncomplete(profile)) {
        pendingRegistrationEmail = null;

        set({
          errorMessage: null,
          isInitialized: true,
          isPasswordRecovery: false,
          linkedSettlementIds: [],
          passwordRecoveryError: null,
          profile,
          role: null,
          session,
          status: 'needs_registration',
          user: session.user,
        });
        return;
      }

      const approvalStatus = getApprovalStatus(profile);

      if (approvalStatus === 'rejected') {
        await supabase.auth.signOut();
        applyUnauthenticatedState('המשתמש שלך נדחה, פנה למנהל מערכת');
        return;
      }

      if (approvalStatus === 'pending_approval' || !profile.is_active) {
        const shouldSilenceInactiveError =
          normalizedPendingRegistrationEmail !== null &&
          normalizedSessionEmail === normalizedPendingRegistrationEmail;

        await supabase.auth.signOut();
        applyUnauthenticatedState(
          shouldSilenceInactiveError
            ? null
            : 'ההרשמה התקבלה וממתינה לאישור מנהל מערכת'
        );
        return;
      }
    }

    pendingRegistrationEmail = null;

    if (profile) {
      queryClient.setQueryData(queryKeys.auth.profile, profile);
    } else {
      queryClient.removeQueries({ queryKey: queryKeys.auth.profile });
    }

    set({
      errorMessage: null,
      isInitialized: true,
      isPasswordRecovery,
      linkedSettlementIds: profile?.linkedSettlementIds ?? [],
      passwordRecoveryError: null,
      profile,
      role: profile?.role ?? null,
      session,
      status: 'authenticated',
      user: session.user,
    });
  };

  const syncSession = async (
    session: Session | null,
    options: { recovery?: boolean } = {}
  ) => {
    try {
      if (!session) {
        pendingRegistrationEmail = null;
        applyUnauthenticatedState();
        return;
      }

      await applyAuthenticatedState(session, options);
    } catch (error) {
      applyUnauthenticatedState(
        getPresentableErrorMessage(error, 'לא ניתן לסנכרן את נתוני ההתחברות')
      );
      throw error;
    }
  };

  return {
    beginPasswordRecovery: () => {
      pendingRegistrationEmail = null;
      set({
        errorMessage: null,
        isPasswordRecovery: true,
        passwordRecoveryError: null,
      });
    },
    clearError: () => {
      set({ errorMessage: null });
    },
    clearPasswordRecoveryState: () => {
      set({
        isPasswordRecovery: false,
        passwordRecoveryError: null,
      });
    },
    deleteAccount: async () => {
      set((state) => ({
        ...state,
        errorMessage: null,
        status: 'loading',
      }));

      try {
        await deleteCurrentUserAccount();
        await supabase.auth
          .signOut({ scope: 'local' })
          .catch(() => supabase.auth.signOut().catch(() => undefined));
        applyUnauthenticatedState();

        return {
          message: 'החשבון נמחק בהצלחה',
          success: true,
        };
      } catch (error) {
        const message = getPresentableErrorMessage(error, 'לא ניתן למחוק את החשבון כרגע');

        set((state) => ({
          ...state,
          errorMessage: message,
          status: state.session ? 'authenticated' : 'unauthenticated',
        }));

        return {
          message,
          success: false,
        };
      }
    },
    errorMessage: null,
    failPasswordRecovery: (message) => {
      set({
        errorMessage: null,
        isPasswordRecovery: false,
        passwordRecoveryError: message,
      });
    },
    initialize: async () => {
      if (get().isInitialized && get().status !== 'idle') {
        return;
      }

      if (initializePromise) {
        await initializePromise;
        return;
      }

      set((state) => ({ ...state, status: 'loading' }));

      initializePromise = (async () => {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          applyUnauthenticatedState(translateAuthError(error));
        } else {
          await syncSession(data.session ?? null, {
            recovery: get().isPasswordRecovery,
          });
        }

        if (!authSubscription) {
          authSubscription = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              get().beginPasswordRecovery();
            }

            void syncSession(session, {
              recovery: event === 'PASSWORD_RECOVERY' || get().isPasswordRecovery,
            }).catch(() => {
              // syncSession already applies the unauthenticated/error state.
            });
          }).data.subscription;
        }
      })()
        .catch((error: unknown) => {
          applyUnauthenticatedState(
            getPresentableErrorMessage(error, 'אירעה שגיאה באתחול החשבון')
          );
        })
        .finally(() => {
          initializePromise = null;
        });

      await initializePromise;
    },
    isInitialized: false,
    isPasswordRecovery: false,
    linkedSettlementIds: [],
    passwordRecoveryError: null,
    profile: null,
    refreshProfile: async () => {
      const session = get().session;

      if (!session) {
        applyUnauthenticatedState();
        return;
      }

      try {
        await applyAuthenticatedState(session);
      } catch (error) {
        applyUnauthenticatedState(
          getPresentableErrorMessage(error, 'לא ניתן לרענן את פרטי המשתמש')
        );
      }
    },
    role: null,
    sendEmailOtp: async (email) => {
      set((state) => ({
        ...state,
        errorMessage: null,
      }));

      try {
        const normalizedEmail = await sendEmailOtp(email);

        return {
          email: normalizedEmail,
          message: 'נשלח אליך קוד אימות למייל',
          success: true,
        };
      } catch (error) {
        const message = getPresentableErrorMessage(error, 'לא ניתן לשלוח בקשת אימות כעת');
        set({ errorMessage: message });

        return {
          message,
          success: false,
        };
      }
    },
    sendPhoneOtp: async (phone) => {
      set((state) => ({
        ...state,
        errorMessage: null,
      }));

      try {
        const normalizedPhone = await sendPhoneOtp(phone);

        return {
          message: 'נשלח אליך קוד אימות',
          phone: normalizedPhone,
          success: true,
        };
      } catch (error) {
        const message = getPresentableErrorMessage(error, 'לא ניתן לשלוח בקשת אימות כעת');
        set({ errorMessage: message });

        return {
          message,
          success: false,
        };
      }
    },
    session: null,
    signIn: async ({ email, password }) => {
      pendingRegistrationEmail = null;

      set((state) => ({
        ...state,
        errorMessage: null,
        isPasswordRecovery: false,
        passwordRecoveryError: null,
        status: 'loading',
      }));

      let normalizedEmail: string;

      try {
        normalizedEmail = normalizeEmailAddress(email);
      } catch (error) {
        const message = getPresentableErrorMessage(error, 'יש להזין כתובת אימייל תקינה');
        applyUnauthenticatedState(message);

        return {
          message,
          reason: 'unknown',
          success: false,
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const message = translateAuthError(error);
        const reason = error.message.includes('Invalid login credentials')
          ? 'invalid_credentials'
          : 'unknown';

        applyUnauthenticatedState(message);

        return {
          message,
          reason,
          success: false,
        };
      }

      try {
        await syncSession(data.session ?? null);
      } catch (syncError) {
        const message = getPresentableErrorMessage(
          syncError,
          'לא ניתן להשלים את הכניסה'
        );

        return {
          message,
          reason: 'unknown',
          success: false,
        };
      }

      if (get().status !== 'authenticated') {
        const message = get().errorMessage ?? 'לא ניתן להשלים את הכניסה';

        return {
          message,
          reason: message.includes('אינו פעיל') ? 'inactive_account' : 'unknown',
          success: false,
        };
      }

      return { success: true };
    },
    signInWithEmailOtp: async ({ email, token }) => {
      pendingRegistrationEmail = null;

      set((state) => ({
        ...state,
        errorMessage: null,
        isPasswordRecovery: false,
        passwordRecoveryError: null,
        status: 'loading',
      }));

      try {
        const session = await verifyEmailOtp({ email, token });
        await syncSession(session);
      } catch (error) {
        const message = getPresentableErrorMessage(error, 'הקוד שגוי או פג תוקף');
        await supabase.auth.signOut();
        applyUnauthenticatedState(message);

        return {
          message,
          reason: 'unknown',
          success: false,
        };
      }

      const state = get();

      if (state.status === 'needs_registration') {
        return {
          reason: 'needs_registration',
          success: true,
        };
      }

      if (state.status !== 'authenticated') {
        const message = state.errorMessage ?? 'לא ניתן להשלים את הכניסה';

        return {
          message,
          reason: message.includes('נדחה')
            ? 'rejected'
            : message.includes('ממתינה לאישור')
              ? 'pending_approval'
              : 'unknown',
          success: false,
        };
      }

      return { success: true };
    },
    signInWithPhoneOtp: async ({ phone, token }) => {
      pendingRegistrationEmail = null;

      set((state) => ({
        ...state,
        errorMessage: null,
        isPasswordRecovery: false,
        passwordRecoveryError: null,
        status: 'loading',
      }));

      try {
        const session = await verifyPhoneOtp({ phone, token });
        await syncSession(session);
      } catch (error) {
        const message = getPresentableErrorMessage(error, 'הקוד שגוי או פג תוקף');
        await supabase.auth.signOut();
        applyUnauthenticatedState(message);

        return {
          message,
          reason: 'unknown',
          success: false,
        };
      }

      const state = get();

      if (state.status === 'needs_registration') {
        return {
          reason: 'needs_registration',
          success: true,
        };
      }

      if (state.status !== 'authenticated') {
        const message = state.errorMessage ?? 'לא ניתן להשלים את הכניסה';

        return {
          message,
          reason: message.includes('נדחה')
            ? 'rejected'
            : message.includes('ממתינה לאישור')
              ? 'pending_approval'
              : 'unknown',
          success: false,
        };
      }

      return { success: true };
    },
    signUp: async ({
      email,
      fullName,
      password,
      phone,
      requestedRole,
      settlementArea,
    }) => {
      pendingRegistrationEmail = email.toLowerCase();

      set((state) => ({
        ...state,
        errorMessage: null,
        isPasswordRecovery: false,
        passwordRecoveryError: null,
        status: 'loading',
      }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone ?? null,
            requested_role: requestedRole,
            settlement_area: settlementArea ?? null,
          },
        },
      });

      if (error) {
        pendingRegistrationEmail = null;

        const message = translateAuthError(error);

        applyUnauthenticatedState(message);

        return {
          message,
          success: false,
        };
      }

      try {
        if (data.session) {
          await supabase.auth.signOut();
        } else {
          pendingRegistrationEmail = null;
        }

        applyUnauthenticatedState();
      } catch (signOutError) {
        pendingRegistrationEmail = null;

        const message = getPresentableErrorMessage(
          signOutError,
          'לא ניתן להשלים את בקשת ההרשמה'
        );

        applyUnauthenticatedState(message);

        return {
          message,
          success: false,
        };
      }

      return { success: true };
    },
    completeEmailRegistrationWithPassword: async ({ password, ...payload }) => {
      const session = get().session;

      if (!session) {
        applyUnauthenticatedState('יש לאמת כתובת אימייל לפני השלמת ההרשמה');

        return {
          message: 'יש לאמת כתובת אימייל לפני השלמת ההרשמה',
          success: false,
        };
      }

      set((state) => ({
        ...state,
        errorMessage: null,
        status: 'loading',
      }));

      try {
        await setAuthenticatedUserPassword(password);
        await completeEmailRegistration(payload);
        await supabase.auth.signOut();
        applyUnauthenticatedState('ההרשמה הושלמה וממתינה לאישור מנהל מערכת');

        return {
          message: 'ההרשמה הושלמה וממתינה לאישור מנהל מערכת',
          success: true,
        };
      } catch (error) {
        const message = getPresentableErrorMessage(
          error,
          'לא ניתן להשלים את ההרשמה'
        );

        set((state) => ({
          ...state,
          errorMessage: message,
          status: 'needs_registration',
        }));

        return {
          message,
          success: false,
        };
      }
    },
    completeEmailRegistration: async (payload) => {
      const session = get().session;

      if (!session) {
        applyUnauthenticatedState('יש לאמת כתובת אימייל לפני השלמת הרשמה');

        return {
          message: 'יש לאמת כתובת אימייל לפני השלמת הרשמה',
          success: false,
        };
      }

      set((state) => ({
        ...state,
        errorMessage: null,
        status: 'loading',
      }));

      try {
        await completeEmailRegistration(payload);
        await supabase.auth.signOut();
        applyUnauthenticatedState('ההרשמה התקבלה וממתינה לאישור מנהל מערכת');

        return {
          message: 'ההרשמה התקבלה וממתינה לאישור מנהל מערכת',
          success: true,
        };
      } catch (error) {
        const message = getPresentableErrorMessage(
          error,
          'לא ניתן להשלים את בקשת ההרשמה'
        );

        set((state) => ({
          ...state,
          errorMessage: message,
          status: 'needs_registration',
        }));

        return {
          message,
          success: false,
        };
      }
    },
    completePhoneRegistration: async (payload) => {
      const session = get().session;

      if (!session) {
        applyUnauthenticatedState('יש לאמת מספר טלפון לפני השלמת הרשמה');

        return {
          message: 'יש לאמת מספר טלפון לפני השלמת הרשמה',
          success: false,
        };
      }

      set((state) => ({
        ...state,
        errorMessage: null,
        status: 'loading',
      }));

      try {
        await completePhoneRegistration(payload);
        await supabase.auth.signOut();
        applyUnauthenticatedState('ההרשמה התקבלה וממתינה לאישור מנהל מערכת');

        return {
          message: 'ההרשמה התקבלה וממתינה לאישור מנהל מערכת',
          success: true,
        };
      } catch (error) {
        const message = getPresentableErrorMessage(
          error,
          'לא ניתן להשלים את בקשת ההרשמה'
        );

        set((state) => ({
          ...state,
          errorMessage: message,
          status: 'needs_registration',
        }));

        return {
          message,
          success: false,
        };
      }
    },
    signOut: async () => {
      pendingRegistrationEmail = null;

      const { error } = await supabase.auth.signOut();

      if (error) {
        const message = translateAuthError(error);
        set({ errorMessage: message });

        return {
          message,
          success: false,
        };
      }

      applyUnauthenticatedState();

      return { success: true };
    },
    status: 'idle',
    user: null,
  };
});
