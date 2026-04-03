# כוננות שיא

אפליקציית React Native/Expo לניהול כוננות יישובית, אימונים, התראות ודירוגי יישובים.

## תשתית שנבנתה

- Expo + TypeScript + Expo Router
- Supabase client עם חיבור auth
- TanStack Query provider
- Zustand auth store
- React Hook Form + Zod למסך התחברות
- מעטפת UI כהה עם RTL מלא
- ניווט bottom tabs וזרימת auth בסיסית

## עקרון דומיין

במערכת הזו היישוב הוא יחידת הכוננות המרכזית. לכל יישוב יש יחידת כוננות אחת בדיוק, ולכן אין ישות נפרדת של squad.

## הפעלה

```bash
npm install
npm run start
```

## סביבת עבודה

יוצרים קובץ `.env` לפי `.env.example` וממלאים:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## מבנה תיקיות

```text
app/
  (auth)/
  (app)/
    (tabs)/
src/
  components/
  config/
  features/
  lib/
  providers/
  stores/
  theme/
```
