# App Review Notes - כוננות שיא

## What the app does

כוננות שיא היא מערכת פנימית לניהול אימונים, יישובים, הרשאות משתמשים, סיכומי אימון ותוכן מקצועי. הגישה מיועדת למשתמשים מורשים בלבד, לפי תפקידים והרשאות שמוגדרים במערכת.

## Test account

האפליקציה משתמשת בהתחברות Email OTP. לפני שליחה ל-Review יש ליצור משתמש בדיקה מאושר ולספק לאפל כתובת אימייל שניתן לקבל דרכה את קוד האימות.

פרטי חשבון הבדיקה למילוי לפני ההגשה:

- Email: יש להזין כתובת בדיקה מאושרת.
- OTP access: יש לוודא שלבודק יש גישה לקוד שנשלח למייל, או שיש תיאום מראש לקבלת הקוד.
- Role: מומלץ לתת תפקיד `super_admin` או תפקיד משתמש מאושר שמאפשר לראות את המסכים המרכזיים.

## Privacy Policy

קישור מדיניות הפרטיות זמין לפני התחברות במסכי Login/Register וגם מתוך Profile.

Privacy Policy URL:
https://ophbra22.github.io/privacy-policy/privacy.html

## Support / Contact

קישור תמיכה ויצירת קשר זמין לפני התחברות במסכי Login/Register וגם מתוך Profile.

Support URL:
https://ophbra22.github.io/privacy-policy/contact.html

Support email:
ophbra22@gmail.com

## Delete Account

Users can delete their account directly from Profile > Delete Account. Once confirmed, the account and related profile data are permanently deleted immediately, and the user is signed out.

מחיקת חשבון זמינה מתוך:

Profile → מחיקת חשבון

לאחר אישור המשתמש, חשבון ההתחברות ונתוני הפרופיל הקשורים נמחקים לצמיתות באופן מיידי, והמשתמש מנותק מהאפליקציה.

## Permissions

האפליקציה מבקשת הרשאת Calendar רק כאשר המשתמש בוחר להוסיף אימון ליומן המכשיר. ההרשאה משמשת ליצירת אירוע אימון ביומן המקומי של המשתמש.

## Review guidance

האפליקציה מיועדת לניהול אימונים והרשאות לפי תפקיד. משתמשים לא מאושרים אינם יכולים לגשת למסכי המערכת עד שמנהל מערכת מאשר אותם.
