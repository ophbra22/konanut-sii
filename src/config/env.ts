import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'חסר EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .url('EXPO_PUBLIC_SUPABASE_URL חייב להיות URL תקין'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => issue.path.join('.'));

  console.error('שגיאת הגדרות סביבה', issues);
  throw new Error('הגדרות הסביבה של האפליקציה אינן תקינות');
}

export const env = {
  supabaseAnonKey: parsedEnv.data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  supabaseUrl: parsedEnv.data.EXPO_PUBLIC_SUPABASE_URL,
} as const;
