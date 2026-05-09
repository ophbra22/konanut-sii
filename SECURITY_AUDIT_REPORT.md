# Security Audit Report - כוננות שיא

תאריך בדיקה: 2026-05-04  
היקף: Expo / React Native / Expo Router, Supabase Auth, Postgres/RLS, קוד לקוח, migrations, קבצי config, one-time import scripts, שיתוף/יומן ו-readiness ל-production.  
מגבלה: לא בוצעו תיקונים, לא הורצו migrations, ולא שונו קבצי קוד או קונפיגורציה קיימים.

## 1. סיכום מצב אבטחה כללי

מצב האבטחה הנוכחי בינוני-גבוה בסיכון: קיימת שכבת RLS משמעותית והרבה פעולות רגישות אכן מוגבלות לפי role ב-DB, אך נמצאו כמה חריגים חמורים שמאפשרים דליפת מידע או עקיפת מודל ההרשאות.

הבעיה הדחופה ביותר היא חשיפת `SUPABASE_SERVICE_ROLE_KEY` בקובץ tracked. מפתח כזה עוקף RLS לחלוטין ולכן יש להתייחס אליו כאל מפתח שנפרץ. בנוסף, קיימים נתיבי SQL/RPC שמדלגים על scope: `list_global_settlement_rankings` מוגדר כ-`security definer` ופתוח לכל authenticated ללא בדיקת role/scope, ו-policy של `settlement_rankings` מאפשרת לכל משתמש פעיל לראות את דירוגי כל היישובים. זה מפר את מודל ההרשאות המבוקש עבור מחב"ל, מש"ק מועצה, משקב"ט, מפל"ג וסמפל"ג.

ה-client ברובו מסתמך על RLS ולא רק על הסתרת כפתורים, וזה טוב. עם זאת, יש טעינות רחבות, הודעות שגיאה גולמיות במסכים, לוגים עם פרטי Auth, וללא audit trail לפעולות מנהל רגישות.

## 2. טבלת בעיות לפי חומרה

| חומרה | כמות | בעיות עיקריות |
| --- | ---: | --- |
| Critical | 2 | חשיפת `service_role`; RPC גלובלי עוקף RLS לדירוגי יישובים |
| High | 4 | `settlement_rankings` גלובלי לכל משתמש פעיל; קובץ Excel מבצעי tracked; grants רחבים לפונקציות; RPC מחיקת מועצה בודק role ללא `is_active` |
| Medium | 9 | חשיפת רשימות יישובים/מועצות בהרשמה; שגיאות גולמיות; console logs; session ב-AsyncStorage; חסר audit logs; ולידציית DB חסרה; hardcoded admin identity; dependency audit moderate; כל מועצות גלויות לכל active |
| Low | 5 | debug log ב-root; `select('*')` לא מינימלי; קישורי תוכן חיצוניים לא מוגבלים; חסר lint/test security gates; notifications לא ממומש ולכן לא נבדק מעשית |

## 3. פירוט ממצאים

### SEC-001 - Supabase service_role key חשוף בקובץ tracked

- חומרה: Critical
- קבצים מושפעים: `one-time-import/env.`, `one-time-import/import.mjs`, `one-time-import/fix-imported-trainings.mjs`, `.gitignore`
- הסיכון: `service_role` עוקף את כל RLS ויכול לקרוא/לשנות/למחוק נתונים בכל הטבלאות.
- ניצול אפשרי: מי שמקבל את הקובץ או היסטוריית git יכול להריץ Supabase client עם המפתח ולגשת לכל המידע המבצעי והאישי.
- המלצת תיקון: לסובב מיד את מפתח ה-service role ב-Supabase Dashboard, למחוק את הקובץ מה-repo ומהיסטוריית git, להוסיף ignore ל-`one-time-import/env.*`, ולעבור לניהול סודות מחוץ ל-repo.
- נדרש: Supabase Dashboard + Git history cleanup + Environment.

### SEC-002 - RPC `list_global_settlement_rankings` עוקף RLS

- חומרה: Critical
- קבצים מושפעים: `supabase/migrations/20260404150000_add_plaga_hierarchy_and_scope.sql`, `supabase/migrations/20260407140000_add_council_linking_and_ranking_refactor.sql`, `src/types/database.ts`
- הסיכון: הפונקציה `security definer`, פתוחה ל-`authenticated`, ולא בודקת `is_active`, `approval_status`, role או scope.
- ניצול אפשרי: כל משתמש עם session, כולל משתמש ממתין אם יש לו token, יכול לקרוא דירוגי כשירות של כל היישובים דרך `supabase.rpc('list_global_settlement_rankings', ...)`.
- המלצת תיקון: להוסיף בדיקת הרשאה בתוך הפונקציה או להחליף ל-`security invoker`; לסנן לפי `has_settlement_access`; ולבצע `revoke execute` עד לתיקון.
- נדרש: SQL migration + Supabase verification.

### SEC-003 - `settlement_rankings` גלוי לכל משתמש פעיל

- חומרה: High
- קבצים מושפעים: `supabase/migrations/20260403143000_add_instructor_rbac_rls.sql`, `src/features/dashboard/api/dashboard-service.ts`, `src/features/rankings/api/rankings-service.ts`, `src/features/settlements/api/settlements-service.ts`
- הסיכון: policy `settlement_rankings_select_all_roles` משתמשת ב-`public.is_active_user()` בלבד ולא ב-`has_settlement_access`.
- ניצול אפשרי: משקב"ט של יישוב אחד או מחב"ל של מועצה אחת יכול לקרוא דירוגים של כל היישובים הפעילים.
- המלצת תיקון: להחליף policy ל-scope לפי `settlement_id`; לוודא שכל queries ו-RPC מקבלים רק רשומות מורשות.
- נדרש: SQL migration + בדיקות TestFlight לפי roles.

### SEC-004 - מידע מבצעי ב-`one-time-import/training-status.xlsx` tracked

- חומרה: High
- קבצים מושפעים: `one-time-import/training-status.xlsx`
- הסיכון: קובץ Excel יכול להכיל סטטוסי אימונים, יישובים, מועצות ואחוזי השתתפות.
- ניצול אפשרי: כל מי שיש לו גישה ל-repo מקבל snapshot מבצעי שאינו מוגן ב-RLS.
- המלצת תיקון: להוציא את הקובץ מה-repo ומהיסטוריה, להחזיק אותו בכספת/אחסון מוגבל, ולהוסיף ignore לקבצי import רגישים.
- נדרש: Git history cleanup + תהליך עבודה.

### SEC-005 - Grants רחבים לפונקציות וטבלאות

- חומרה: High
- קבצים מושפעים: `supabase/migrations/20260403093000_initial_foundation.sql`, `supabase/migrations/20260403143000_add_instructor_rbac_rls.sql`
- הסיכון: קיימים `grant execute on all functions in schema public to authenticated` ו-grants רחבים לטבלאות. RLS מצמצם טבלאות, אך פונקציות `security definer` עתידיות עלולות להיפתח אוטומטית.
- ניצול אפשרי: פונקציה חדשה/ישנה ללא בדיקת הרשאה פנימית תהיה callable לכל משתמש authenticated.
- המלצת תיקון: לעבור ל-revoke-by-default ול-grant ספציפי רק לפונקציות שנבדקו.
- נדרש: SQL migration + Supabase privileges review.

### SEC-006 - `delete_regional_council` בודק role ללא `is_active`

- חומרה: High
- קבצים מושפעים: `supabase/migrations/20260407173000_add_delete_regional_council_rpc.sql`
- הסיכון: הפונקציה בודקת `profile.role = 'super_admin'` ישירות, בלי `is_active = true` ובלי `approval_status = 'approved'`.
- ניצול אפשרי: session של פרופיל super_admin לא פעיל/לא מאושר עלול למחוק מועצה אם הוא מצליח לקרוא ל-RPC.
- המלצת תיקון: להשתמש ב-`public.has_any_role(array['super_admin'])`, להוסיף revoke public מפורש, ולבדוק `auth.uid()`.
- נדרש: SQL migration.

### SEC-007 - אפשרויות הרשמה חושפות רשימת יישובים ומועצות

- חומרה: Medium
- קבצים מושפעים: `supabase/migrations/20260424130000_switch_default_auth_to_email_otp.sql`, `supabase/migrations/20260424120000_add_phone_auth_registration_approval.sql`, `src/features/auth/api/email-auth-service.ts`, `src/features/auth/api/phone-auth-service.ts`
- הסיכון: `list_email_registration_options` ו-`list_phone_registration_options` הן `security definer` ומחזירות את כל היישובים הפעילים והמועצות לכל authenticated.
- ניצול אפשרי: משתמש חדש לפני אישור מנהל יכול לקבל מיפוי יישובים/מועצות.
- המלצת תיקון: להחליט אם זה נדרש UX; אם כן לצמצם שדות, לא לחשוף פלגה/מועצה מלאה, או להעביר לבחירה ידנית/קוד הזמנה.
- נדרש: SQL + UX/Product decision.

### SEC-008 - כל המועצות גלויות לכל משתמש פעיל

- חומרה: Medium
- קבצים מושפעים: `supabase/migrations/20260404150000_add_plaga_hierarchy_and_scope.sql`, `src/features/councils/api/councils-service.ts`
- הסיכון: `regional_councils_select_active_users` מאפשר לכל active user לקרוא את כל המועצות.
- ניצול אפשרי: משתמש scoped מקבל רשימת מועצות שאינן בתחום אחריותו.
- המלצת תיקון: להחיל scope לפי role: global roles הכל, plaga roles לפי פלגה, council roles רק linked councils, settlement roles רק council של היישוב.
- נדרש: SQL migration.

### SEC-009 - הודעות שגיאה גולמיות מוצגות במסכים

- חומרה: Medium
- קבצים מושפעים: `app/(app)/(tabs)/dashboard.tsx`, `app/(app)/(tabs)/settlements.tsx`, `app/(app)/(tabs)/trainings.tsx`, `app/(app)/(tabs)/calendar.tsx`, `app/(app)/trainings/[trainingId].tsx`, `app/(app)/settlements/[settlementId].tsx`, `app/(app)/admin/*.tsx`, `app/(app)/professional-content/*.tsx`
- הסיכון: חלק מהמסכים מציגים `error.message` או `mutation.error.message` ישירות.
- ניצול אפשרי: הודעות Postgres/RLS/Supabase עשויות לחשוף שמות טבלאות, policies, פונקציות או פרטי schema.
- המלצת תיקון: להשתמש בכל UI ב-`getPresentableErrorMessage` או בשכבת error mapping לפי action.
- נדרש: תיקון קוד.

### SEC-010 - Console logs עם פרטי Auth/PII

- חומרה: Medium
- קבצים מושפעים: `src/stores/auth-store.ts`, `src/features/auth/api/email-auth-service.ts`, `src/features/auth/api/phone-auth-service.ts`, `index.js`
- הסיכון: `auth-store.ts` מדפיס אימיילים, תוצאת profile וניתובי OTP ללא guard של production. שירותי email/phone מוגנים ב-`NODE_ENV`, אך עדיין מדפיסים PII בפיתוח.
- ניצול אפשרי: לוגים ב-device, TestFlight logs או סביבת debug יכולים לחשוף אימיילים/טלפונים וסטטוסי הרשמה.
- המלצת תיקון: להסיר לוגים או להעביר ל-logger שמסתיר PII ונכבֶה ב-production.
- נדרש: תיקון קוד.

### SEC-011 - Session נשמר ב-AsyncStorage לא מוצפן

- חומרה: Medium
- קבצים מושפעים: `src/lib/supabase.ts`
- הסיכון: Supabase session/refresh token נשמרים ב-AsyncStorage, שאינו secure storage.
- ניצול אפשרי: מכשיר פרוץ, backup לא מוצפן, או כלי forensic עשויים לקרוא refresh token.
- המלצת תיקון: להשתמש ב-SecureStore/Keychain adapter ל-Supabase auth storage.
- נדרש: תיקון קוד + בדיקת migration session.

### SEC-012 - חסרים audit logs לפעולות מנהל

- חומרה: Medium
- קבצים מושפעים: `supabase/migrations/*`, `src/features/auth/api/user-approval-service.ts`, `src/features/councils/api/councils-service.ts`, `src/features/settlements/api/settlements-service.ts`, `src/features/trainings/api/trainings-service.ts`
- הסיכון: אין טבלת `audit_logs` או טריגרים לתיעוד אישור משתמשים, שינוי roles, מחיקות, עדכוני מועצות/יישובים ואימונים.
- ניצול אפשרי: פעולה שגויה או זדונית של admin/instructor קשה לייחוס ולחקירה.
- המלצת תיקון: להוסיף `audit_logs` עם RLS קריאה ל-super_admin בלבד וטריגרים/RPC logging.
- נדרש: SQL + קוד אופציונלי להצגה.

### SEC-013 - ולידציה ב-DB חסרה לשדות טקסט ו-JSON

- חומרה: Medium
- קבצים מושפעים: `src/features/trainings/schemas/training-form-schema.ts`, `src/features/settlements/schemas/settlement-form-schema.ts`, `src/features/professional-content/schemas/professional-content-form-schema.ts`, `supabase/migrations/*`
- הסיכון: ה-client מגביל חלק מהקלט, אך DB אינו מגביל אורכי title/location/notes/name/comment/url ואינו מאמת JSON `settlement_attendance` מול `training_settlements`.
- ניצול אפשרי: קריאה ישירה ל-Supabase API יכולה להכניס טקסטים ענקיים, HTML/script, או attendance לא עקבי.
- המלצת תיקון: להוסיף constraints ב-DB לאורך/פורמט, ולשקול RPC ליצירת/עדכון אימון שמוודא עקביות.
- נדרש: SQL + תיקון קוד אם עוברים ל-RPC.

### SEC-014 - זהות מנהל מערכת hardcoded

- חומרה: Medium
- קבצים מושפעים: `supabase/migrations/20260424130000_switch_default_auth_to_email_otp.sql`, `src/features/auth/api/email-auth-service.ts`, `src/features/auth/api/phone-auth-service.ts`, `APP_REVIEW_NOTES.md`
- הסיכון: אימייל/טלפון מנהל מוטמעים בקוד וב-migrations.
- ניצול אפשרי: חשיפת יעד תקיפה/phishing, וקושי בניהול production/staging.
- המלצת תיקון: להעביר bootstrap admin לתהליך ידני מאובטח או secret-driven migration חד-פעמי שאינו בקוד ציבורי.
- נדרש: SQL/process + קוד.

### SEC-015 - תלויות עם `npm audit` moderate

- חומרה: Medium
- קבצים מושפעים: `package.json`, `package-lock.json`
- הסיכון: `npm audit --json` מצא 14 חולשות moderate, כולל PostCSS XSS ושרשרת Expo/Metro. אין high/critical לפי npm audit.
- ניצול אפשרי: בעיקר סיכון build/web tooling, תלוי שימוש ב-web export ותוכן CSS.
- המלצת תיקון: לעקוב אחרי גרסאות Expo SDK 54 compatible ולעדכן ללא downgrade/breaking fix אוטומטי.
- נדרש: Dependency management.

### SEC-016 - `select('*')` במספר פעולות

- חומרה: Low
- קבצים מושפעים: `src/features/settlements/api/settlements-service.ts`, `src/features/trainings/api/trainings-service.ts`
- הסיכון: החזרת יותר עמודות מהנדרש מגדילה blast radius אם נוספות עמודות רגישות בעתיד.
- ניצול אפשרי: UI/API יקבלו שדות חדשים בלי כוונה.
- המלצת תיקון: להחליף ל-select מפורש בכל query.
- נדרש: תיקון קוד.

### SEC-017 - קישורי תוכן מקצועי חיצוניים לא מוגבלים

- חומרה: Low
- קבצים מושפעים: `src/features/professional-content/schemas/professional-content-form-schema.ts`, `app/(app)/(tabs)/professional-content.tsx`
- הסיכון: מנהל/מדריך יכול להכניס URL חיצוני לכל דומיין.
- ניצול אפשרי: אם חשבון מורשה נפרץ, ניתן להפנות משתמשים ל-phishing.
- המלצת תיקון: allowlist לדומיינים מאושרים או warning ברור לקישורים חיצוניים.
- נדרש: קוד + החלטת מדיניות.

### SEC-018 - שיתוף ויומן כוללים מידע מבצעי

- חומרה: Low
- קבצים מושפעים: `app/(app)/settlements/[settlementId].tsx`, `app/(app)/trainings/[trainingId].tsx`, `src/features/trainings/lib/device-calendar.ts`
- הסיכון: Share ו-Calendar שולחים מידע שהמשתמש כבר רואה, אך לאחר השיתוף הוא יוצא מגבולות האפליקציה.
- ניצול אפשרי: משתמש מורשה משתף סיכום אימון/יישוב לאפליקציה חיצונית.
- המלצת תיקון: להוסיף בדיקת role/scope לפני export/share, לצמצם שדות רגישים, ולהוסיף אזהרת משתמש אם נדרש.
- נדרש: קוד/UX.

### SEC-019 - Notifications לא ממומש

- חומרה: Low
- קבצים מושפעים: אין טבלאות/קוד notification או device tokens שנמצאו.
- הסיכון: לא נמצא מנגנון התראות לבדיקה; אם יתווסף בעתיד יש לוודא RLS והצפנת device tokens.
- ניצול אפשרי: לא ישים כרגע.
- המלצת תיקון: לפני הוספת notifications, לתכנן טבלת device tokens עם RLS לפי `auth.uid()` ושירות server-side לשליחה.
- נדרש: עתידי.

### SEC-020 - חסרים lint/test/security gates

- חומרה: Low
- קבצים מושפעים: `package.json`
- הסיכון: אין סקריפטי lint/test שמונעים regressions אבטחתיים פשוטים.
- ניצול אפשרי: לוגים, `select('*')`, או `error.message` חדשים ייכנסו בלי זיהוי.
- המלצת תיקון: להוסיף lint, בדיקות RLS ידניות/אוטומטיות וסקריפט grep ל-secrets.
- נדרש: קוד/tooling.

## 4. בדיקות ידניות מומלצות ב-TestFlight

1. משתמש ממתין לאישור: להתחבר עם Email OTP אחרי אימות ולוודא שאינו רואה Dashboard, Rankings, Settlements, Trainings, Calendar או Professional Content.
2. משתמש ממתין: לנסות לקרוא ידנית RPC `list_global_settlement_rankings` מול ה-anon key ולוודא שנחסם.
3. משקב"ט: לוודא שרואה רק יישוב משויך, אימונים משויכים, משובים והתראות משויכים.
4. משקב"ט: לוודא שאינו רואה דירוגי יישובים אחרים במסך דירוגים, Dashboard, פרטי יישוב ו-share.
5. מחב"ל/מש"ק מועצה: לוודא שכל נתון מוגבל למועצות המשויכות בלבד.
6. מפל"ג/סמפל"ג: לוודא שכל נתון מוגבל לפלגה המשויכת בלבד.
7. רז"ר/סרז"ר: לוודא צפייה בלבד, ללא כפתורי יצירה/עריכה/מחיקה, וגם שקריאות API ישירות נכשלות.
8. מדריך: לוודא שיכול ליצור/לערוך אימונים ומשובים, אך לא לנהל יישובים, מועצות או משתמשים.
9. מנהל מערכת: לוודא אישור/דחיית משתמשים, שינוי role ומחיקת משתמשים.
10. לנסות deep links למסכי `/admin/*`, `/settlements/create`, `/trainings/create`, `/professional-content/create` מכל role מוגבל.
11. לבדוק שהודעות שגיאה ב-production אינן מציגות RLS/Postgres/schema details.
12. לבדוק Share/Calendar מכל role scoped ולוודא שאין מידע מחוץ להרשאה.
13. לבדוק שאין logs עם אימייל/טלפון/סטטוס OTP ב-TestFlight device logs.
14. לבדוק שה-service role החדש לא קיים בשום bundle, repo artifact או EAS env פומבי.

## 5. תיקונים מומלצים לפי סדר עדיפות

1. לסובב מיד `SUPABASE_SERVICE_ROLE_KEY`, למחוק `one-time-import/env.` ולטפל בהיסטוריית git.
2. לנעול או לתקן `list_global_settlement_rankings` כך שלא יעקוף RLS.
3. להחליף את policy של `settlement_rankings` מ-`is_active_user()` ל-`has_settlement_access(settlement_id)`.
4. לצמצם grants: לבטל `grant execute on all functions` ולעבור ל-grants נקודתיים.
5. להסיר/לצמצם `training-status.xlsx` מה-repo ומהיסטוריה.
6. לתקן `delete_regional_council` לשימוש ב-`has_any_role(['super_admin'])`.
7. להסיר console logs ו-debug log ב-`index.js`.
8. להחליף כל הצגת `error.message` בהודעות ממופות.
9. להעביר Supabase auth storage ל-SecureStore/Keychain.
10. להוסיף audit logs לפעולות מנהל ופעולות מבצעיות רגישות.
11. להוסיף DB constraints לאורכי טקסט ו-json consistency.
12. להוסיף lint/test/security grep כחלק מ-CI.

## 6. בדיקות שבוצעו

- נסרקו קבצי source, `app`, `src`, `supabase/migrations`, `supabase/seed.sql`, config, docs ו-one-time import.
- נבדקו secrets, `.gitignore`, tracked env files, service role, `EXPO_PUBLIC` env.
- נבדקו Supabase Auth flows, profile loading, approval status, registration RPCs.
- נבדקו RLS policies, functions, `security definer`, grants, role checks.
- נבדקו `select('*')`, console logs, `error.message`, Share, Calendar ו-notifications.
- הורץ `npm audit --json` במצב read-only.

