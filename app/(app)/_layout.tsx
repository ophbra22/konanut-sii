import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { useAuthStore } from '@/src/stores/auth-store';

export default function AppLayout() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated' || !isInitialized || status === 'idle' || status === 'loading') {
      return;
    }

    router.replace(status === 'needs_registration' ? '/register' : '/login');
  }, [isInitialized, router, status]);

  if (!isInitialized || status === 'idle' || status === 'loading') {
    return <AppLoader label="מעלה את מרכז השליטה..." />;
  }

  if (status !== 'authenticated') {
    return <AppLoader label="מחזיר למסך הכניסה..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin/councils-management" />
      <Stack.Screen name="admin/users-approval" />
      <Stack.Screen name="admin/users-management" />
      <Stack.Screen name="professional-content/create" />
      <Stack.Screen name="professional-content/[contentId]/edit" />
      <Stack.Screen name="settlement-rankings" />
    </Stack>
  );
}
