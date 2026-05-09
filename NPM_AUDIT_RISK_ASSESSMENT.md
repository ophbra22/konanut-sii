# NPM Audit Risk Assessment

תאריך בדיקה: 2026-05-04

נבדקו 14 חולשות `moderate` שמדווחות על ידי `npm audit`. לא הורץ `npm audit fix --force`, לא בוצע downgrade, ולא שודרג Expo SDK major. נשמרה תאימות ל-Expo SDK 54.

## סיכום הסיכון

הסיכון המעשי לאפליקציית iOS/TestFlight נמוך-בינוני ולא נראה כחוסם הפצה. כל 14 הרשומות נובעות משתי חולשות בסיסיות בלבד:

1. `postcss < 8.5.10` - XSS אפשרי בזמן CSS stringify.
2. `uuid < 14.0.0` - חסר bounds check כאשר משתמשים ידנית ב-buffer ב-v3/v5/v6.

בפרויקט הזה שתי החולשות מגיעות דרך Expo CLI / Metro / config / prebuild tooling:

- `postcss` מגיע דרך `@expo/metro-config`, כלומר tooling של bundling/build.
- `uuid` מגיע דרך `xcode`, שמגיע דרך `@expo/config-plugins`, כלומר tooling של config/prebuild/native project manipulation.

לא נמצאה אינדיקציה שהחולשות האלו רצות כלוגיקת runtime בתוך אפליקציית iOS ב-TestFlight. הן כן רלוונטיות לסביבת build, במיוחד אם בונים תוכן לא מהימן או מריצים prebuild/config על inputs לא מהימנים.

## מה נבדק

- `npm audit`
- `npm audit --json`
- `npm audit fix` רגיל בלבד, ללא `--force`
- `npm ls postcss uuid xcode @expo/config @expo/config-plugins @expo/metro-config expo-constants expo-router expo-asset --all`
- `npm explain postcss`
- `npm explain uuid`
- `npm explain xcode`
- `npx expo-doctor`
- `npx expo install --check`
- `npm run typecheck`

## מה תוקן

לא תוקנה אף אחת מ-14 חולשות ה-audit, כי לא נמצא תיקון בטוח ששומר על Expo SDK 54.

`npm audit fix` רגיל לא הוריד את מספר החולשות. הוא לא הפעיל את התיקון שה-audit מציע, כי התיקון דורש `--force` ושינוי breaking.

בדיקות תאימות אחרי הבדיקה:

- `npx expo-doctor` עבר: 17/17.
- `npx expo install --check` עבר: dependencies up to date.
- `npm run typecheck` עבר.

## פירוט חולשות

| # | Package affected | Dependency path | Runtime או tooling/build | השפעה על iOS/TestFlight | תיקון בטוח ב-SDK 54 | המלצה |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `postcss <8.5.10` | `expo -> @expo/metro-config -> postcss@8.4.49` | Build tooling / Metro CSS processing | לא צפויה השפעת runtime באפליקציית iOS. רלוונטי בעיקר בזמן build או web/CSS processing. | לא. `@expo/metro-config@54.0.15` מבקש `postcss ~8.4.32`; תיקון דורש `8.5.10+` מחוץ לטווח. | לדחות לעדכון Expo SDK/patch רשמי. לא להשתמש ב-CSS לא מהימן בתהליך build. |
| 2 | `uuid <14.0.0` | `expo -> @expo/config-plugins -> xcode@3.0.1 -> uuid@7.0.3` | Build/prebuild tooling | לא צפויה השפעת runtime באפליקציית iOS. `xcode` משמש config/prebuild native project manipulation. | לא. `xcode@3.0.1` מבקש `uuid ^7.0.3`; תיקון ל-`14+` מחוץ לטווח ועלול לשבור API. | לדחות לעדכון Expo config plugins/xcode רשמי. |
| 3 | `xcode` | `expo -> @expo/config-plugins -> xcode -> uuid` | Build/prebuild tooling | לא runtime. | לא, כי התיקון הוא ב-`uuid` מחוץ לטווח הנתמך. | לדחות לעדכון Expo SDK/patch. |
| 4 | `@expo/config-plugins` | `expo -> @expo/config-plugins -> xcode -> uuid` | Build/prebuild tooling | לא runtime. | לא. `npm audit fix --force` מציע שינוי breaking/downgrade מוזר ל-Expo 49. | לדחות לעדכון Expo רשמי. |
| 5 | `@expo/config` | `expo / expo-constants / @expo/metro-config -> @expo/config -> @expo/config-plugins -> xcode -> uuid` | Build/config tooling | עקיף בלבד; לא advisory על runtime של `expo-constants`. | לא במסגרת SDK 54. | לדחות לעדכון Expo SDK/patch. |
| 6 | `@expo/prebuild-config` | `expo -> @expo/cli -> @expo/prebuild-config -> @expo/config / @expo/config-plugins` | Prebuild tooling | לא runtime. | לא בטוח ללא שינוי Expo packages מחוץ לסט הנתמך. | לדחות; להריץ prebuild רק על inputs מהימנים. |
| 7 | `@expo/metro-config` | `expo -> @expo/metro-config -> postcss` וגם `@expo/config` | Build tooling / Metro | לא runtime ב-TestFlight; רלוונטי ל-bundling. | לא. תיקון `postcss` מחוץ לטווח `~8.4.32`. | לדחות לעדכון Expo רשמי. |
| 8 | `@expo/cli` | `expo -> @expo/cli -> @expo/metro-config / @expo/config / @expo/prebuild-config` | CLI/build tooling | לא runtime. | לא. | לדחות. |
| 9 | `expo` | Direct dependency -> affected Expo tooling chain | Mixed package, אבל advisory בפועל דרך tooling/config dependencies | לא מזוהה כסיכון runtime ישיר ל-iOS bundle. | לא. `npm audit` מציע `expo@49.0.23`, שזה downgrade/breaking ואסור. | להישאר על SDK 54 ולעדכן כש-Expo מפרסמים תיקון תואם. |
| 10 | `@react-native-community/datetimepicker` | Direct dependency -> peer/dependency chain דרך `expo` | Runtime package, אבל ה-audit מגיע מ-`expo`, לא מ-datetimepicker עצמו | אין advisory ספציפי ל-runtime של datetimepicker. | לא. audit מציע `8.1.1`, downgrade/לא תואם SDK 54. | לא לבצע downgrade. |
| 11 | `expo-constants` | Direct dependency -> `@expo/config -> @expo/config-plugins -> xcode -> uuid` | Runtime package עם config tooling dependency | האזהרה מגיעה מתלות config; לא נמצא סיכון runtime ישיר. | לא. audit מציע `55.0.15`, Expo SDK 55, לא SDK 54. | לדחות ל-Expo SDK 55+ או patch רשמי ל-SDK 54. |
| 12 | `expo-asset` | `expo -> expo-asset -> expo-constants -> @expo/config` | Runtime package, affected דרך `expo-constants` | לא סיכון runtime ישיר לפי הנתיב. | לא במסגרת SDK 54. | לדחות. |
| 13 | `expo-linking` | Direct dependency -> `expo-constants -> @expo/config` | Runtime package, affected דרך `expo-constants` | לא advisory runtime ישיר ל-linking. | לא. audit מציע `55.0.14`, SDK 55. | לדחות. |
| 14 | `expo-router` | Direct dependency -> `expo-constants`, `expo-linking` | Runtime/router package, affected דרך Expo dependencies | לא advisory runtime ישיר ל-router. | לא. audit מציע `55.0.13`, SDK 55. | לדחות. |

## למה לא נוספו overrides

לא הוספתי `overrides` ל-`postcss` או `uuid`:

- `postcss@8.5.10+` אינו עומד בטווח `~8.4.32` של `@expo/metro-config@54.0.15`.
- `uuid@14+` אינו עומד בטווח `^7.0.3` של `xcode@3.0.1`, ועלול לשבור imports/API של חבילת `xcode`.
- overrides כאלה עשויים לגרום ל-build/prebuild failures שקשה לזהות מראש, ולכן אינם נחשבים תיקון בטוח במסגרת Expo SDK 54.

## מה נשאר

- 14 חולשות `moderate` עדיין מדווחות על ידי `npm audit`.
- אין `high` או `critical`.
- כולן קשורות לשרשרת Expo tooling/config/build לפי הנתיבים שנבדקו.

## האם זה חוסם App Store/TestFlight

לא נראה כחוסם App Store/TestFlight:

- אין חולשות `high` או `critical`.
- אין עדות ל-service secret או runtime credential leak דרך ה-audit.
- הנתיבים המרכזיים הם build tooling ולא קוד אפליקציה שרץ אצל משתמשי iOS.
- `expo-doctor`, `expo install --check`, ו-TypeScript עוברים.

עם זאת, מומלץ לשמור build pipeline סגור:

- להריץ builds רק מסביבת CI/מחשב מהימנים.
- לא להריץ Metro/prebuild על קוד או CSS ממקור לא מהימן.
- לא לקבל PR/build scripts ממקור לא מהימן בלי review.

## המלצה להמשך

1. לא להריץ `npm audit fix --force`.
2. לא לבצע downgrade ל-Expo 49 או ל-datetimepicker 8.1.1.
3. לא לשדרג ידנית ל-Expo SDK 55 רק כדי לספק audit, אלא לבצע שדרוג SDK מסודר כשמוכנים.
4. לעקוב אחרי patch רשמי של Expo SDK 54 או לתכנן שדרוג ל-SDK הבא.
5. להריץ `npm audit` מחדש אחרי כל `npx expo install`/SDK update.
6. אם יש CI, להוסיף gate שמבדיל בין runtime dependencies לבין Expo build tooling כדי לא לחסום release על false-positive/SDK-bound audit chain.
