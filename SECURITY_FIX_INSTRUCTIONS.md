# Security Fix Instructions

הקובץ הזה מכסה את הפעולות הידניות שנדרשות אחרי תיקוני Critical/High. אל תכניס לכאן secrets אמיתיים.

## 1. Rotate ל-service_role key ב-Supabase

1. היכנס ל-Supabase Dashboard של הפרויקט.
2. עבור אל Project Settings -> API.
3. תחת Project API keys בצע rotate ל-`service_role` key.
4. עדכן את המפתח החדש רק בכספת סודות מאובטחת או בסביבה מקומית שאינה tracked.
5. אל תכניס את המפתח ל-`EXPO_PUBLIC_*`, `app.json`, `app.config`, `eas.json`, source code, README או migration.
6. הרץ import scripts רק ממכונה מקומית מאובטחת עם env file ignored או עם secret manager.
7. אחרי rotate, ודא שהמפתח הישן כבר לא עובד באמצעות ניסיון קריאה server-side מבוקר. אין לבצע בדיקה כזו מה-client.

## 2. ניקוי המפתח מהיסטוריית Git

הקובץ `one-time-import/env.` היה tracked ולכן צריך לנקות גם את ההיסטוריה. הפעולה הזאת משנה היסטוריית Git ודורשת תיאום עם כל מי שעובד על הריפו.

פקודות מומלצות:

```bash
git status --short
git rm --cached -- one-time-import/env. one-time-import/training-status.xlsx
git commit -m "Remove sensitive import artifacts from tracking"
```

לאחר מכן נקה היסטוריה באחת מהדרכים:

```bash
brew install git-filter-repo
git filter-repo --path one-time-import/env. --path one-time-import/training-status.xlsx --invert-paths
```

אם לא ניתן להשתמש ב-`git-filter-repo`, אפשר להשתמש ב-BFG Repo-Cleaner:

```bash
brew install bfg
bfg --delete-files env. --delete-files training-status.xlsx
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

אחרי ניקוי היסטוריה:

```bash
git log --all -- one-time-import/env. one-time-import/training-status.xlsx
git grep -n "SUPABASE_SERVICE_ROLE_KEY" $(git rev-list --all)
```

אם הריפו כבר שותף ב-remote, צריך force push מתואם:

```bash
git push --force-with-lease --all
git push --force-with-lease --tags
```

כל clone קיים צריך להיחשב חשוד. בקש מכל המפתחים לבצע clone חדש אחרי הניקוי.

## 3. בדיקה שאין secret ב-EAS או bundle

בדוק סודות ב-EAS:

```bash
eas secret:list
eas env:list
```

ודא שלא קיים `SUPABASE_SERVICE_ROLE_KEY` באף environment של Expo/EAS. אם הוא קיים, מחק אותו:

```bash
eas secret:delete --name SUPABASE_SERVICE_ROLE_KEY
```

בדיקת source מקומית:

```bash
rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role|eyJ[A-Za-z0-9_-]+\\." . \
  -g '!node_modules' \
  -g '!dist' \
  -g '!one-time-import/node_modules'
```

בדיקת build artifacts אחרי build:

```bash
rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role|eyJ[A-Za-z0-9_-]+\\." dist build .expo \
  -g '!node_modules'
```

אם `dist`, `build` או `.expo` לא קיימים, זה תקין.

## 4. סדר הרצת migrations ב-Supabase

1. הרץ קודם בסביבת staging או פרויקט Supabase משוכפל.
2. ודא שכל migrations הקודמים כבר קיימים בסביבה.
3. הרץ רק את migration החדש:

```bash
supabase migration up
```

או דרך Supabase Dashboard SQL Editor עם תוכן הקובץ:

```text
supabase/migrations/20260504120000_fix_critical_high_security_findings.sql
```

4. הרץ את בדיקות ה-RLS הידניות:

```text
supabase/security/rls_security_tests.sql
```

5. בדוק באפליקציה:
   - משתמש ממתין לאישור לא רואה דירוגים או RPC.
   - משקב"ט רואה רק יישוב משויך.
   - מחב"ל/מש"ק מועצה רואים רק מועצות משויכות.
   - מפל"ג/סמפל"ג רואים רק פלגה משויכת.
   - super_admin מאושר יכול למחוק מועצה.
   - super_admin לא פעיל או pending לא יכול למחוק מועצה.
