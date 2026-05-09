import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/src/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('הגדרות Supabase חסרות');
}

function assertValidSupabaseUrl(value: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error('כתובת Supabase אינה תקינה');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('כתובת Supabase חייבת להתחיל ב-https');
  }

  if (
    parsedUrl.hostname === 'localhost' ||
    parsedUrl.hostname === '127.0.0.1' ||
    parsedUrl.hostname === '0.0.0.0'
  ) {
    throw new Error('כתובת Supabase לא יכולה להיות localhost במובייל');
  }
}

assertValidSupabaseUrl(supabaseUrl);

const secureAuthStorage = {
  async getItem(key: string) {
    try {
      if (!(await SecureStore.isAvailableAsync())) {
        return null;
      }

      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async removeItem(key: string) {
    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Keep auth cleanup non-blocking if the platform secure store is unavailable.
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      // Supabase can continue the in-memory session even if persistence is unavailable.
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: secureAuthStorage,
  },
  global: {
    headers: {
      'x-application-name': 'konanut-sii-mobile',
    },
  },
});
