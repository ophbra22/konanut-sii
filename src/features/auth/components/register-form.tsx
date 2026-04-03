import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Lock,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTextField } from '@/src/components/ui/app-text-field';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/src/features/auth/schemas/register-schema';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export function RegisterForm() {
  const router = useRouter();
  const authError = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const signUp = useAuthStore((state) => state.signUp);
  const status = useAuthStore((state) => state.status);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      full_name: '',
      password: '',
      password_confirmation: '',
      phone: '',
      requested_role: 'viewer',
      settlement_area: '',
    },
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const isBusy = isSubmitting || status === 'loading';
  const hasFieldErrors = Object.keys(errors).length > 0;

  const onSubmit = handleSubmit(async (values) => {
    clearError();

    const result = await signUp({
      email: values.email.trim().toLowerCase(),
      fullName: values.full_name.trim(),
      password: values.password,
      phone: values.phone.trim() || undefined,
      requestedRole: values.requested_role,
      settlementArea: values.settlement_area?.trim() || undefined,
    });

    if (!result.success) {
      return;
    }

    reset();
    setIsSuccess(true);
  });

  const footer = (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        clearError();
        router.replace('/login' as never);
      }}
      style={({ pressed }) => [styles.linkRow, pressed ? styles.linkPressed : null]}
    >
      <ArrowRight color={theme.colors.info} size={15} strokeWidth={2.2} />
      <Text style={styles.linkText}>כבר יש לך חשבון? להתחברות</Text>
    </Pressable>
  );

  if (isSuccess) {
    return (
      <AuthScreenShell
        badgeLabel="בקשת גישה נקלטה"
        cardDescription="החשבון נשמר במצב ממתין לאישור, ולא תתאפשר כניסה עד להפעלה על ידי מנהל."
        cardTitle="הבקשה נשלחה"
        footer={footer}
        subtitle="הגישה למערכת מבוקרת ומופעלת רק לאחר בדיקה ואישור של מנהל."
        title="בקשת הרשמה למערכת"
      >
        <View style={styles.successState}>
          <View style={styles.successIcon}>
            <ShieldCheck color={theme.colors.accentStrong} size={26} strokeWidth={2.2} />
          </View>
          <Text style={styles.successTitle}>הבקשה נשלחה בהצלחה וממתינה לאישור מנהל</Text>
          <Text style={styles.successDescription}>
            לאחר אישור החשבון ניתן יהיה להתחבר עם כתובת הדוא"ל והסיסמה שבחרתם.
          </Text>
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      badgeLabel="בקשת גישה מבוקרת"
      cardDescription="הגישה לאפליקציה נפתחת רק לאחר בדיקה ואישור מנהל, ולכן חשבונות חדשים נוצרים במצב ממתין."
      cardTitle="פרטי הרשמה"
      footer={footer}
      subtitle="מלאו את הפרטים המבצעיים ליצירת בקשת גישה חדשה למערכת."
      title="בקשת הרשמה למערכת"
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              autoCapitalize="words"
              autoComplete="name"
              errorMessage={errors.full_name?.message}
              icon={<UserRound />}
              label="שם מלא"
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              placeholder="הזינו שם מלא"
              returnKeyType="next"
              textContentType="name"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              errorMessage={errors.email?.message}
              icon={<Mail />}
              keyboardType="email-address"
              label='דוא"ל'
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              placeholder="name@example.com"
              returnKeyType="next"
              textAlign="left"
              textContentType="emailAddress"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              errorMessage={errors.password?.message}
              icon={<Lock />}
              label="סיסמה"
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              placeholder="בחרו סיסמה"
              returnKeyType="next"
              secureTextEntry
              textAlign="left"
              textContentType="newPassword"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        <Controller
          control={control}
          name="password_confirmation"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              errorMessage={errors.password_confirmation?.message}
              icon={<Lock />}
              label="אימות סיסמה"
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              placeholder="הזינו שוב את הסיסמה"
              returnKeyType="next"
              secureTextEntry
              textAlign="left"
              textContentType="password"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        <Controller
          control={control}
          name="requested_role"
          render={({ field: { onChange, value } }) => (
            <View style={styles.roleField}>
              <Text style={styles.roleLabel}>תפקיד מבוקש</Text>
              <View style={styles.roleOptions}>
                {ROLE_OPTIONS.map((option) => {
                  const isSelected = value === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      onPress={() => {
                        clearError();
                        onChange(option.value);
                      }}
                      style={({ pressed }) => [
                        styles.roleOption,
                        isSelected ? styles.roleOptionSelected : null,
                        pressed ? styles.roleOptionPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleOptionTitle,
                          isSelected ? styles.roleOptionTitleSelected : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.roleOptionDescription,
                          isSelected ? styles.roleOptionDescriptionSelected : null,
                        ]}
                      >
                        {option.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.roleHint}>התפקיד בפועל ייקבע רק לאחר אישור מנהל.</Text>
            </View>
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              autoCapitalize="none"
              autoComplete="tel"
              errorMessage={errors.phone?.message}
              hint="אופציונלי"
              icon={<Phone />}
              keyboardType="phone-pad"
              label="טלפון"
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              placeholder="050-0000000"
              returnKeyType="next"
              textAlign="left"
              textContentType="telephoneNumber"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        <Controller
          control={control}
          name="settlement_area"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              errorMessage={errors.settlement_area?.message}
              hint="אופציונלי"
              icon={<MapPinned />}
              label="יישוב / אזור"
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              placeholder="לדוגמה: שדרות / עוטף עזה"
              returnKeyType="done"
              value={value ?? ''}
            />
          )}
        />

        {!hasFieldErrors && authError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        ) : null}

        <AuthSubmitButton
          disabled={isBusy}
          label="שליחת בקשת גישה"
          loading={isBusy}
          loadingLabel="שולח בקשה..."
          onPress={() => {
            void onSubmit();
          }}
        />

        <View style={styles.securityRow}>
          <ShieldCheck color={theme.colors.textMuted} size={14} strokeWidth={2.1} />
          <Text style={styles.securityText}>גישה מאובטחת • פתיחה לאחר אישור מנהל</Text>
        </View>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: 'rgba(255, 114, 87, 0.22)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    textAlign: 'right',
  },
  form: {
    gap: theme.spacing.lg,
  },
  linkPressed: {
    opacity: 0.82,
  },
  linkRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  linkText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    textAlign: 'center',
  },
  roleField: {
    gap: theme.spacing.xs,
  },
  roleHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  roleLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  roleOption: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  roleOptionDescription: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  roleOptionDescriptionSelected: {
    color: theme.colors.textSecondary,
  },
  roleOptionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  roleOptions: {
    gap: theme.spacing.sm,
  },
  roleOptionSelected: {
    ...theme.elevation.focus,
    backgroundColor: theme.colors.surfaceInfo,
    borderColor: theme.colors.info,
  },
  roleOptionTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  roleOptionTitleSelected: {
    color: theme.colors.info,
  },
  securityRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  securityText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  successDescription: {
    ...theme.typography.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
    borderColor: 'rgba(199, 243, 107, 0.22)',
    borderRadius: 22,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  successState: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  successTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});

const ROLE_OPTIONS: Array<{
  description: string;
  label: string;
  value: RegisterFormValues['requested_role'];
}> = [
  {
    description: 'גישה לצפייה בנתוני המערכת לאחר אישור.',
    label: 'צופה',
    value: 'viewer',
  },
  {
    description: 'שיוך מבצעי ליישוב אחד או יותר, לפי הקצאה של מנהל.',
    label: 'משקב״ט',
    value: 'mashkabat',
  },
  {
    description: 'גישה לניהול אימונים ומשובים בתחום האחריות.',
    label: 'מדריך',
    value: 'instructor',
  },
  {
    description: 'בקשת הרשאה ניהולית מלאה, בכפוף לאישור מפורש.',
    label: 'מנהל מערכת',
    value: 'super_admin',
  },
];
