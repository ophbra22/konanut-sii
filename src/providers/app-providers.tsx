import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppToast } from '@/src/components/feedback/app-toast';
import {
  consumePasswordRecoveryUrl,
  isPasswordRecoveryLink,
} from '@/src/features/auth/api/password-reset-service';
import { queryClient } from '@/src/lib/query-client';
import { useAuthStore } from '@/src/stores/auth-store';
import { AppThemeProvider } from '@/src/theme';

function AuthBootstrap({ children }: PropsWithChildren) {
  const beginPasswordRecovery = useAuthStore((state) => state.beginPasswordRecovery);
  const failPasswordRecovery = useAuthStore((state) => state.failPasswordRecovery);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const handleIncomingUrl = async (url: string | null) => {
      if (!url || !isPasswordRecoveryLink(url)) {
        return;
      }

      await initialize();
      beginPasswordRecovery();

      const result = await consumePasswordRecoveryUrl(url);

      if (!result.handled) {
        return;
      }

      router.replace('/reset-password');

      if (!result.success) {
        failPasswordRecovery(
          result.message ?? 'לא ניתן לאמת את קישור איפוס הסיסמה'
        );
      }
    };

    void Linking.getInitialURL().then((url) => {
      void handleIncomingUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [beginPasswordRecovery, failPasswordRecovery, initialize]);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthBootstrap>
              {children}
              <AppToast />
            </AuthBootstrap>
          </QueryClientProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
