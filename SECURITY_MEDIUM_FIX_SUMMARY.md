# Security Medium Fix Summary

תאריך תיקון: 2026-05-04

טופלו רק הבעיות `SEC-009`, `SEC-010`, `SEC-011`, ו-`SEC-016`. לא בוצעו migrations, לא שונו RLS policies, ולא בוצעו שינויי UI או עיצוב.

## מה שונה

| מזהה | מה שונה |
| --- | --- |
| SEC-009 | הצגות ישירות של `error.message` / `mutation.error.message` במסכים הוחלפו ב-`getPresentableErrorMessage` עם הודעות fallback בעברית לפי הפעולה. |
| SEC-010 | הוסרו לוגים של Email OTP / SMS OTP / OTP verify שהדפיסו אימיילים, טלפונים, session/profile status, user id או redirect/auth state. הוסר גם לוג boot כללי מ-`index.js`. |
| SEC-011 | Supabase auth session עבר מ-AsyncStorage ל-Expo SecureStore adapter. נוספה תלות `expo-secure-store` וה-config plugin שלה. |
| SEC-016 | כל `select('*')` בקוד ה-client הוחלפו ב-select מפורש לשדות שהמסכים והשירותים צריכים בפועל. |

## קבצים ששונו

- `app.json`
- `package.json`
- `package-lock.json`
- `index.js`
- `src/lib/supabase.ts`
- `src/lib/error-utils.ts`
- `src/stores/auth-store.ts`
- `src/features/auth/api/email-auth-service.ts`
- `src/features/auth/api/phone-auth-service.ts`
- `src/features/auth/api/profile-service.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/register-form.tsx`
- `src/features/auth/hooks/use-user-approval-mutations.ts`
- `src/features/settlements/api/settlements-service.ts`
- `src/features/trainings/api/trainings-service.ts`
- מסכי Dashboard, יישובים, אימונים, יומן, פרופיל, ניהול משתמשים, ניהול מועצות ותוכן מקצועי תחת `app/(app)`.

## איך לבדוק ידנית

1. להריץ את האפליקציה ב-Expo Go ולבצע login עם Email OTP.
2. לסגור ולפתוח את האפליקציה מחדש ולוודא שה-session משוחזר.
3. לבצע logout ולוודא שה-session לא חוזר אחרי restart.
4. לבדוק TestFlight: login, logout, password login, Email OTP, הרשמה והשלמת פרטים.
5. לגרום לשגיאת רשת או RLS מבוקרת ולוודא שהמסכים מציגים הודעה ידידותית בעברית ולא שמות טבלאות, policy, Postgres או Supabase.
6. לבדוק Dashboard, Settlements, Training details, Calendar, Admin, Professional Content ו-Profile.
7. לבדוק device logs ב-TestFlight ולוודא שאין אימיילים, טלפונים, OTP/session/profile status או user ids.
8. לבדוק ש-list/create/update settlement ו-update training status עדיין עובדים.

## סיכונים/הערות

- מעבר ל-SecureStore אומר ש-session ישן שנשמר בעבר ב-AsyncStorage לא תמיד ישוחזר אחרי העדכון; משתמשים עשויים להידרש להתחבר מחדש פעם אחת.
- ב-web או בסביבה שבה SecureStore לא זמין, ה-session יישאר בזיכרון אך לא יישמר בין פתיחות. Expo Go/TestFlight אמורים להשתמש ב-SecureStore.
- ה-helper מסתיר הודעות טכניות לפי patterns. אם תתווסף שגיאת backend חדשה בניסוח לא מוכר, ייתכן שצריך להוסיף pattern נוסף ל-`src/lib/error-utils.ts`.
