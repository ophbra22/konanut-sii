import AsyncStorage from '@react-native-async-storage/async-storage';

export type PendingAuthIntent = 'login' | 'registration';

export type PendingAuthIntentState = {
  email: string | null;
  intent: PendingAuthIntent;
};

const PENDING_AUTH_INTENT_KEY = 'konanut-sii.pending-auth-intent';

export async function savePendingAuthIntent(state: PendingAuthIntentState) {
  await AsyncStorage.setItem(PENDING_AUTH_INTENT_KEY, JSON.stringify(state));
}

export async function loadPendingAuthIntent() {
  const rawValue = await AsyncStorage.getItem(PENDING_AUTH_INTENT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PendingAuthIntentState>;

    if (parsed.intent !== 'login' && parsed.intent !== 'registration') {
      return null;
    }

    return {
      email: typeof parsed.email === 'string' ? parsed.email : null,
      intent: parsed.intent,
    };
  } catch {
    return null;
  }
}

export async function clearPendingAuthIntent() {
  await AsyncStorage.removeItem(PENDING_AUTH_INTENT_KEY);
}
