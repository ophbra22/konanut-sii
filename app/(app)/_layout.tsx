import { Redirect } from 'expo-router/build/link/Redirect';
import { Stack } from 'expo-router/stack';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { useAuthStore } from '@/src/stores/auth-store';

export default function AppLayout() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const status = useAuthStore((state) => state.status);

  if (!isInitialized || status === 'idle' || status === 'loading') {
    return <AppLoader label="מעלה את מרכז השליטה..." />;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin/users-approval" />
      <Stack.Screen name="admin/users-management" />
      <Stack.Screen name="settlement-rankings" />
    </Stack>
  );
}
