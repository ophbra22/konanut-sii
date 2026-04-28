import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { useAuthStore } from '@/src/stores/auth-store';

export default function IndexScreen() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (!isInitialized || status === 'idle' || status === 'loading') {
      return;
    }

    router.replace(
      status === 'authenticated'
        ? '/dashboard'
        : status === 'needs_registration'
          ? '/register'
          : '/login'
    );
  }, [isInitialized, router, status]);

  if (!isInitialized || status === 'idle' || status === 'loading') {
    return <AppLoader label="טוען את סביבת הכוננות..." />;
  }

  return <AppLoader label="מעביר למסך המתאים..." />;
}
