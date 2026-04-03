import { Redirect } from 'expo-router/build/link/Redirect';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { useAuthStore } from '@/src/stores/auth-store';

export default function IndexScreen() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const status = useAuthStore((state) => state.status);

  if (!isInitialized || status === 'idle' || status === 'loading') {
    return <AppLoader label="טוען את סביבת הכוננות..." />;
  }

  return <Redirect href={status === 'authenticated' ? '/dashboard' : '/login'} />;
}
