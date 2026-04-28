# App Store Ready Checklist - כוננות שיא

תאריך בדיקה: 2026-04-25

## סטטוס כללי

האפליקציה מוכנה עקרונית ל-TestFlight לאחר build production ב-EAS, אך לפני שליחה ל-App Review צריך להשלים פעולות ידניות ב-Apple Developer, App Store Connect ו-Supabase.

## מה נבדק

- מבנה הפרויקט: Expo Managed / Expo Router / React Native, ללא תיקיות native קבועות `ios` או `android`.
- קונפיגורציית Expo: `name`, `slug`, `version`, `scheme`, `icon`, `splash`, `ios.bundleIdentifier`, `ios.buildNumber`, והרשאות יומן.
- נכסי אפליקציה: `assets/icon.png`, `assets/splash-icon.png`, `assets/adaptive-icon.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`.
- קישורי Privacy Policy ו-Support זמינים במסכי Login/Register ובמסך Profile.
- זרימת מחיקת חשבון קיימת מתוך Profile, עם אישור משתמש ומחיקה מיידית של חשבון ההתחברות ונתוני הפרופיל.
- RLS ומדיניות מחיקת אימון: כפתור מחיקה מוצג רק למנהל מערכת, ויש policy שמגבילה `DELETE` על `trainings` ל-`super_admin`.
- הרשאות iOS: האפליקציה משתמשת בהרשאת Calendar בלבד כרגע.
- טקסטי שגיאה מרכזיים עוברים דרך הודעות עברית ידידותיות ולא דרך הודעות Supabase גולמיות.
- PWA/Web metadata קיימים למסלול web, כולל manifest ו-Apple meta tags.
- placeholders ושאריות פיתוח בולטות נבדקו ונוקו במקומות רלוונטיים.

## מה תוקן בבדיקה הזו

- הותקנו peer dependencies חסרים ש-`expo-doctor` סימן כקריטיים לבילד native:
  `expo-constants`, `expo-linking`, `react-native-svg`.
- תוקנה חולשת npm גבוהה ב-`@xmldom/xmldom` באמצעות `npm audit fix` רגיל, ללא `--force`.
- נוספה קונפיגורציית `eas.json` בסיסית ל-build/submit production.
- נוסף `NSCalendarsUsageDescription` מפורש ל-iOS.
- הוסר לוג debug זמני מה-root layout של האפליקציה.
- placeholders של אימייל מסוג `name@example.com` הוחלפו בטקסט עברי.
- URL-ים פיקטיביים מסוג `example.com` ב-seed של תוכן מקצועי הוחלפו בקישור תמיכה ציבורי קיים.
- מחיקת חשבון עודכנה למחיקה מיידית מתוך Profile, ללא בקשת אישור מנהל.
- מסך אישור משתמשים כבר לא מציג בקשות מחיקת חשבון.
- נוספה מיגרציה שמבטלת הרשאות execution לפונקציות בקשת המחיקה הישנות ומוסיפה RPC מאובטח למחיקת המשתמש המחובר.

## תוצאות פקודות

- `npm install` עבר בהצלחה.
- `npm run typecheck` עבר בהצלחה.
- `npm run lint` לא קיים בפרויקט.
- `npm test` לא קיים בפרויקט.
- `npx expo-doctor` עבר בהצלחה לאחר התקנת peer dependencies.
- `npm audit fix` הסיר את החולשה הגבוהה; נשארו חולשות moderate שדורשות `--force` ושדרוג breaking ל-Expo ישן, ולכן לא בוצע.

## פעולות ידניות לפני App Review

- להריץ build production:
  ```bash
  npx eas build --platform ios --profile production
  ```
- אם EAS CLI לא מחובר עדיין, להריץ:
  ```bash
  npx eas login
  npx eas build:configure
  ```
- לוודא ב-Supabase שכל המיגרציות production הוחלו, כולל:
  - Email OTP registration/profile fields.
  - immediate self account deletion RPC.
  - training delete RLS restricted to `super_admin`.
  - professional content table/RLS.
- לוודא ב-Supabase Auth ש-Email OTP פעיל ושה-email template שולח קוד 8 ספרות, לא Magic Link בלבד.
- ליצור משתמש בדיקה מאושר ל-Apple Review, או לתת לאפל גישה לתיבת מייל שמקבלת OTP.
- לוודא שאין seed data פיקטיבי ב-production.
- לוודא שה-Privacy Policy וה-Support URLs ציבוריים ונפתחים ללא התחברות.
- לוודא שהחשבון של Apple Review לא דורש אישור מנהל בזמן הבדיקה.

## פרטים למילוי ב-App Store Connect

- App name: כוננות שיא
- Subtitle: מערכת אימונים וניהול מבצעי
- Description: אפליקציה לניהול אימונים, יישובים, הרשאות, סיכומי אימון ותוכן מקצועי עבור משתמשים מורשים.
- Keywords: אימונים, כוננות, יישובים, ניהול מבצעי, הדרכה
- Support URL: https://ophbra22.github.io/privacy-policy/contact.html
- Privacy Policy URL: https://ophbra22.github.io/privacy-policy/privacy.html
- Category: Productivity או Utilities, לפי העדפת ההגשה.
- Age rating: צפוי 4+ אם אין תוכן רגיש, אלימות, מסחר או רשת חברתית פתוחה.
- Privacy Nutrition Label: למלא לפי הנתונים שנאספים בפועל: email, שם, טלפון אם נשמר, תפקיד, שיוך יישוב/מועצה/פלגה, נתוני שימוש מבצעיים.
- Demo account: לספק ידנית באיזור Review Notes.
- Review notes: להשתמש בקובץ `APP_REVIEW_NOTES.md`.

## סיכונים שנותרו

- אין סקריפטי lint/test בפרויקט. מומלץ להוסיף לפני release רשמי, אך `typecheck` ו-`expo-doctor` עברו.
- `npm audit` עדיין מדווח על חולשות moderate בתלויות Expo/Metro שדורשות `npm audit fix --force` עם downgrade/breaking change, ולכן לא תוקנו.
- מחיקת חשבון מתבצעת מיידית דרך RPC מאובטח שמוחק רק את המשתמש המחובר לפי `auth.uid()`.
- לא הורץ EAS production build בפועל כי ייתכן שיידרשו credentials וחשבון Apple Developer.
- בדיקות ידניות על מכשירי iPhone קטנים/גדולים עדיין נדרשות אחרי build.

## מקורות בדיקה רשמיים

- Apple App Privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Apple Account Deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines
- Expo Calendar permissions: https://docs.expo.dev/versions/v54.0.0/sdk/calendar/
