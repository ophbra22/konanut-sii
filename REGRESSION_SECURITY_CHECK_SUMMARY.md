# Regression Security Check Summary

תאריך בדיקה: 2026-05-04

בוצעה בדיקת רגרסיה ו-production readiness אחרי תיקוני האבטחה האחרונים. לא בוצעו migrations, לא שונו RLS policies, לא שונה עיצוב, ולא נוספו פיצ'רים.

## מה נבדק

| בדיקה | תוצאה |
| --- | --- |
| `npm install` | עבר. נשארו 14 חולשות `moderate` לפי npm audit output. |
| `npx expo-doctor` | נכשל תחילה על mismatch גרסאות Expo SDK, עבר לאחר תיקון. |
| `npm run lint --if-present` | עבר ללא פעולה; אין סקריפט `lint` מוגדר ב-`package.json`. |
| `npm test --if-present` | עבר ללא פעולה; אין סקריפט `test` מוגדר ב-`package.json`. |
| `npm run typecheck` | עבר. |
| `npx tsc --noEmit` | עבר. |
| `npx expo export --platform ios --output-dir /tmp/konanut-sii-export-ios` | עבר; Metro הצליח לארוז iOS bundle. |
| חיפוש `error.message` / `mutation.error.message` במסכים | נקי; נשאר שימוש פנימי בלבד ב-helper `src/lib/error-utils.ts`. |
| חיפוש `console.log/info/warn/debug` | נקי; נשאר `console.error` של validation בקובץ env config, לא Auth/PII. |
| חיפוש `select('*')` | נקי. |
| חיפוש `service_role` / `sb_secret` / JWT בקוד וב-bundle | אין secret/JWT ב-bundle. נמצאו רק אזכורי תיעוד והפניות env-var ב-one-time import scripts, ללא ערך סודי. |
| Supabase auth storage | `src/lib/supabase.ts` משתמש ב-Expo SecureStore במקום AsyncStorage. |

## מה נכשל

`npx expo-doctor` נכשל תחילה:

- `expo` היה `54.0.33`, הציפייה של SDK היא `~54.0.34`.
- `expo-linking` היה `8.0.11`, הציפייה של SDK היא `~8.0.12`.

## מה תוקן

עודכנו תלויות Expo תואמות SDK:

- `expo` -> `~54.0.34`
- `expo-linking` -> `~8.0.12`

העדכון שינה את:

- `package.json`
- `package-lock.json`

לא נדרש תיקון TypeScript או import נוסף אחרי העדכון.

## בדיקות אבטחה ממוקדות

1. SecureStore:
   - `src/lib/supabase.ts` כבר לא מייבא `AsyncStorage`.
   - AsyncStorage נשאר רק ל-theme ול-`pending-auth-intent`, לא ל-Supabase session.

2. שגיאות UI:
   - אין הצגה ישירה של `error.message` במסכי `app`.
   - הודעות עוברות דרך `getPresentableErrorMessage` או fallback ידידותי.

3. לוגים:
   - אין `console.log`, `console.info`, `console.warn`, או `console.debug` ב-`app`, `src`, או `index.js`.
   - אין לוגי OTP/Auth/PII.

4. Select מפורש:
   - אין `select('*')` בקוד ה-client.
   - TypeScript עבר, כך שלא זוהו שדות חסרים מה-select המפורש.

5. Secrets:
   - לא נמצא `sb_secret`.
   - לא נמצא JWT secret pattern בקוד או ב-export.
   - נמצאו אזכורי `SUPABASE_SERVICE_ROLE_KEY` רק בהוראות ניקוי/rotate וב-scripts של one-time import כמשתנה סביבה, ללא ערך סודי.

## מה נשאר לבדיקה ידנית ב-TestFlight

1. Login עם Email OTP.
2. Login עם סיסמה, אם פעיל בסביבה.
3. Logout ואז פתיחה מחדש של האפליקציה.
4. Session restore אחרי force close/reopen.
5. הרשמה והשלמת פרטים.
6. משתמש ממתין לאישור לא רואה מידע מבצעי.
7. בדיקת כל role: `super_admin`, `instructor`, `razar`, `sarazar`, `machbal`, `eshkol_officer`, `mashkabat`, `mepag`, `samepag`.
8. Dashboard: טעינה, כרטיסי סטטיסטיקה, אימון הבא, התראות.
9. Settlements: רשימה, פרטים, יצירה/עריכה/מחיקה למורשים בלבד.
10. Trainings: רשימה, יצירה, עריכה, פרטים, סטטוס, משוב, מחיקה.
11. Calendar: חודש/יום, סינון, מעבר ליצירת אימון.
12. Admin screens: אישור משתמשים, ניהול משתמשים, ניהול מועצות.
13. Professional content: רשימה, פתיחת קישור, יצירה/עריכה/מחיקה למורשים בלבד.
14. בדיקת device logs שאין אימיילים, טלפונים, OTP/session/profile status או user ids.
15. בדיקת שגיאת רשת/RLS מבוקרת שמציגה הודעה ידידותית ולא פרטי Supabase/Postgres.

## סיכונים שנותרו

- `npm install` עדיין מדווח על 14 חולשות `moderate`. לא תוקנו כאן כי הן אינן רגרסיה ישירה מהתיקונים האחרונים ועלולות לדרוש עדכוני dependency רחבים יותר.
- משתמשים קיימים עשויים להידרש להתחבר מחדש פעם אחת לאחר המעבר מ-AsyncStorage ל-SecureStore.
- בדיקות role/scope מלאות דורשות משתמשי TestFlight אמיתיים ונתוני staging/production מתאימים.
