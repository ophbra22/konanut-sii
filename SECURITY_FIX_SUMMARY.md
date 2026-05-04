# Security Fix Summary - Critical/High

תאריך תיקון: 2026-05-04

בוצעו תיקונים רק לבעיות Critical ו-High מתוך `SECURITY_AUDIT_REPORT.md`. לא בוצעו שינויי UI, לא שונו פיצ'רים, ולא הורצו migrations בפועל.

## מה תוקן

| מזהה | חומרה | סטטוס | מה נעשה |
| --- | --- | --- | --- |
| SEC-001 | Critical | תוקן בקוד/Repo, נדרש ידני | ה-service role key הוסר מקובץ ה-import המקומי, הקובץ הוסר מה-index בלבד, `.gitignore` חוסם env וקבצי import רגישים, ונוספו הוראות rotate וניקוי היסטוריית Git. |
| SEC-002 | Critical | תוקן ב-migration | `list_global_settlement_rankings` קיבלה revoke לפני הגדרה מחדש, בדיקות `auth.uid()`, `is_active`, `approval_status`, וסינון לפי `has_settlement_access`. |
| SEC-003 | High | תוקן ב-migration | policy רחבה של `settlement_rankings_select_all_roles` מוחלפת ב-`settlement_rankings_select_role_scoped` לפי `settlement_id`. |
| SEC-004 | High | תוקן ב-ignore/Index, נדרש ידני להיסטוריה | `.gitignore` חוסם קבצי Excel/CSV של `one-time-import`; `training-status.xlsx` הוסר מה-index בלבד בלי למחוק את הקובץ המקומי. |
| SEC-005 | High | תוקן ב-migration | בוטלו grants רחבים על כל הפונקציות ונקבעו grants נקודתיים בלבד. |
| SEC-006 | High | תוקן ב-migration | `delete_regional_council` משתמשת ב-`has_any_role(array['super_admin'])`, שבודקת גם `is_active` וגם `approval_status`. |

## Migrations שנוצרו

1. `supabase/migrations/20260504120000_fix_critical_high_security_findings.sql`
   - מחזק את `is_active_user`, `has_any_role`, ופונקציות scope כך שידרשו `approval_status = 'approved'`.
   - מחליף את policy של `settlement_rankings`.
   - מגדיר מחדש את `list_global_settlement_rankings` עם סינון פנימי.
   - מגדיר מחדש את `delete_regional_council`.
   - מבטל grants רחבים ומחזיר grants נקודתיים.

## קבצים ששונו או נוספו

- `.gitignore`
- `one-time-import/env.`
- `supabase/migrations/20260504120000_fix_critical_high_security_findings.sql`
- `supabase/security/rls_security_tests.sql`
- `SECURITY_FIX_SUMMARY.md`
- `SECURITY_FIX_INSTRUCTIONS.md`

## פונקציות שקיבלו grant ולמה

| פונקציה | סיבה |
| --- | --- |
| `is_active_user` | helper מרכזי ל-RLS. |
| `has_any_role` | helper מרכזי ל-RLS ול-RPC רגישים. |
| `is_super_admin`, `is_instructor`, `is_mashkabat` | תאימות למדיניות קיימת ולפונקציות קיימות. |
| `current_assigned_plaga`, `has_plaga_access` | scope לפלגה עבור מפל"ג/סמפל"ג. |
| `has_regional_council_access` | scope מועצה עבור מחב"ל/מש"ק מועצה. |
| `has_settlement_access` | scope יישוב עבור משקב"ט ודירוגים. |
| `has_training_access` | scope אימונים. |
| `can_insert_training`, `can_insert_feedback`, `can_insert_training_settlement` | `with check` במדיניות insert קיימות. |
| `list_global_settlement_rankings` | RPC דירוגים, כעת מסוננת פנימית לפי הרשאות. |
| `complete_email_registration`, `complete_phone_registration` | השלמת הרשמה למשתמש authenticated ממתין. |
| `list_email_registration_options`, `list_phone_registration_options` | מסכי השלמת הרשמה קיימים. |
| `delete_current_user_account` | מחיקת חשבון עצמי. |
| `admin_delete_user_account` | מחיקת משתמש על ידי super admin מאושר. |
| `delete_regional_council` | מחיקת מועצה על ידי super admin מאושר בלבד. |

לא ניתן grant ל-`handle_auth_user_change`, `touch_regional_councils_updated_at`, `request_account_deletion`, או `admin_delete_requested_user_account`, כי הן טריגרים/זרמים לא פעילים או לא נקראות מה-client הנוכחי.

## מה נשאר ידני

1. לבצע rotate ל-service role key ב-Supabase Dashboard.
2. להסיר את `one-time-import/env.` ואת `one-time-import/training-status.xlsx` מהיסטוריית Git.
3. לוודא שאין service role key ב-EAS secrets, build logs, artifacts או bundles.
4. להריץ את migration בסביבת staging לפני production.
5. להריץ ידנית את `supabase/security/rls_security_tests.sql` עם UUIDs אמיתיים של משתמשי בדיקה.
