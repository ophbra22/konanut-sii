import { Redirect } from 'expo-router/build/link/Redirect';
import { Stack } from 'expo-router/stack';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { useAuthStore } from '@/src/stores/auth-store';

export default function AuthLayout() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const shouldShowBootstrapLoader =
    !isInitialized || status === 'idle' || (status === 'loading' && Boolean(session));

  if (shouldShowBootstrapLoader) {
    return <AppLoader label="מכין את מסך הכניסה..." />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
