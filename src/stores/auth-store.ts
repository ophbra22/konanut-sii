import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  fetchUserProfile,
  translateAuthError,
} from '@/src/features/auth/api/profile-service';
import { getPresentableErrorMessage } from '@/src/lib/error-utils';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { supabase } from '@/src/lib/supabase';
import type { AuthProfile, UserRole } from '@/src/types/database';

type AuthStatus = 'authenticated' | 'idle' | 'loading' | 'unauthenticated';

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
  reason?: 'inactive_account' | 'invalid_credentials' | 'unknown';
  success: boolean;
};

type AuthState = {
  beginPasswordRecovery: () => void;
  clearError: () => void;
  clearPasswordRecoveryState: () => void;
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
  session: Session | null;
  signIn: (credentials: Credentials) => Promise<AuthActionResult>;
  signUp: (payload: SignUpPayload) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  status: AuthStatus;
  user: User | null;
};

let authSubscription: { unsubscribe: () => void } | null = null;
let initializePromise: Promise<void> | null = null;
let pendingRegistrationEmail: string | null = null;

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
      if (!profile) {
        await supabase.auth.signOut();
        applyUnauthenticatedState('לא נמצא פרופיל משתמש עבור החשבון הזה');
        return;
      }

      if (profile.deletion_requested_at) {
        await supabase.auth.signOut();
        applyUnauthenticatedState(
          'בקשת מחיקת החשבון התקבלה וממתינה לטיפול. אפשר לפנות לתמיכה לפרטים נוספים.'
        );
        return;
      }

      if (!profile.is_active) {
        const shouldSilenceInactiveError =
          normalizedPendingRegistrationEmail !== null &&
          normalizedSessionEmail === normalizedPendingRegistrationEmail;

        await supabase.auth.signOut();
        applyUnauthenticatedState(
          shouldSilenceInactiveError
            ? null
            : 'החשבון הזה אינו פעיל כרגע. יש לפנות למנהל המערכת'
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

      const { data, error } = await supabase.auth.signInWithPassword({
          email,
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
