import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
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

function isStandaloneWebDisplayMode() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const updateDisplayModeFlag = () => {
      document.documentElement.dataset.displayMode = isStandaloneWebDisplayMode()
        ? 'standalone'
        : 'browser';
    };

    updateDisplayModeFlag();

    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleMediaChange = () => {
      updateDisplayModeFlag();
    };

    standaloneQuery?.addEventListener?.('change', handleMediaChange);

    const handleDocumentClick = (event: MouseEvent) => {
      if (!isStandaloneWebDisplayMode()) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a[href]');

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute('href');

      if (
        !href ||
        href.startsWith('#') ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);

      if (
        !['http:', 'https:'].includes(destination.protocol) ||
        destination.origin !== window.location.origin ||
        !destination.pathname.startsWith('/')
      ) {
        return;
      }

      const nextPath = `${destination.pathname}${destination.search}${destination.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (nextPath === currentPath) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      router.push(nextPath as never);
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      standaloneQuery?.removeEventListener?.('change', handleMediaChange);
      delete document.documentElement.dataset.displayMode;
    };
  }, []);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ direction: 'ltr', flex: 1 }}>
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
