import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { useAuthStore } from '@/src/stores/auth-store';

export default function AuthLayout() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const shouldShowBootstrapLoader =
    !isInitialized || status === 'idle' || (status === 'loading' && Boolean(session));

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    router.replace('/dashboard');
  }, [router, status]);

  if (shouldShowBootstrapLoader) {
    return <AppLoader label="מכין את מסך הכניסה..." />;
  }

  if (status === 'authenticated') {
    return <AppLoader label="מעביר למרכז השליטה..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
