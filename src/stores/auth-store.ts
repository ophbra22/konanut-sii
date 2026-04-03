import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  fetchUserProfile,
  translateAuthError,
} from '@/src/features/auth/api/profile-service';
import { getErrorMessage } from '@/src/lib/error-utils';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { supabase } from '@/src/lib/supabase';
import type { AuthProfile, UserRole } from '@/src/types/database';

type AuthStatus = 'authenticated' | 'idle' | 'loading' | 'unauthenticated';

type Credentials = {
  email: string;
  password: string;
};

type AuthActionResult = {
  message?: string;
  success: boolean;
};

type AuthState = {
  clearError: () => void;
  errorMessage: string | null;
  initialize: () => Promise<void>;
  isInitialized: boolean;
  linkedSettlementIds: string[];
  profile: AuthProfile | null;
  refreshProfile: () => Promise<void>;
  role: UserRole | null;
  session: Session | null;
  signIn: (credentials: Credentials) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  status: AuthStatus;
  user: User | null;
};

let authSubscription: { unsubscribe: () => void } | null = null;
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  const applyUnauthenticatedState = (errorMessage: string | null = null) => {
    queryClient.clear();

    set({
      errorMessage,
      isInitialized: true,
      linkedSettlementIds: [],
      profile: null,
      role: null,
      session: null,
      status: 'unauthenticated',
      user: null,
    });
  };

  const applyAuthenticatedState = async (session: Session) => {
    set((state) => ({
      ...state,
      errorMessage: null,
      session,
      status: 'loading',
      user: session.user,
    }));

    const profile = await fetchUserProfile(session.user.id);

    if (!profile) {
      await supabase.auth.signOut();
      applyUnauthenticatedState('לא נמצא פרופיל משתמש עבור החשבון הזה');
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      applyUnauthenticatedState('החשבון הזה אינו פעיל כרגע. יש לפנות למנהל המערכת');
      return;
    }

    queryClient.setQueryData(queryKeys.auth.profile, profile);

    set({
      errorMessage: null,
      isInitialized: true,
      linkedSettlementIds: profile.linkedSettlementIds,
      profile,
      role: profile.role,
      session,
      status: 'authenticated',
      user: session.user,
    });
  };

  const syncSession = async (session: Session | null) => {
    try {
      if (!session) {
        applyUnauthenticatedState();
        return;
      }

      await applyAuthenticatedState(session);
    } catch (error) {
      applyUnauthenticatedState(
        getErrorMessage(error, 'לא ניתן לסנכרן את נתוני ההתחברות')
      );
      throw error;
    }
  };

  return {
    clearError: () => {
      set({ errorMessage: null });
    },
    errorMessage: null,
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
          await syncSession(data.session ?? null);
        }

        if (!authSubscription) {
          authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
            void syncSession(session);
          }).data.subscription;
        }
      })()
        .catch((error: unknown) => {
          applyUnauthenticatedState(
            getErrorMessage(error, 'אירעה שגיאה באתחול החשבון')
          );
        })
        .finally(() => {
          initializePromise = null;
        });

      await initializePromise;
    },
    isInitialized: false,
    linkedSettlementIds: [],
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
          getErrorMessage(error, 'לא ניתן לרענן את פרטי המשתמש')
        );
      }
    },
    role: null,
    session: null,
    signIn: async ({ email, password }) => {
      set((state) => ({
        ...state,
        errorMessage: null,
        status: 'loading',
      }));

      const { data, error } = await supabase.auth.signInWithPassword({
          email: 'test1@example.com',
          password: 'Test1234!',
      });
      

      if (error) {
        const message = translateAuthError(error);

        applyUnauthenticatedState(message);

        return {
          message,
          success: false,
        };
      }

      try {
        await syncSession(data.session ?? null);
      } catch (syncError) {
        const message = getErrorMessage(syncError, 'לא ניתן להשלים את הכניסה');

        return {
          message,
          success: false,
        };
      }

      if (get().status !== 'authenticated') {
        return {
          message: get().errorMessage ?? 'לא ניתן להשלים את הכניסה',
          success: false,
        };
      }

      return { success: true };
    },
    signOut: async () => {
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
