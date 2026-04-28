import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
  global: {
    headers: {
      'x-application-name': 'konanut-sii-mobile',
    },
  },
});
