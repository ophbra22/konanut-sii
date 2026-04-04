import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail, Shield } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AppTextField } from '@/src/components/ui/app-text-field';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import {
  loginSchema,
  type LoginFormValues,
} from '@/src/features/auth/schemas/login-schema';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  createThemedStyles,
  theme,
  type AppTheme,
} from '@/src/theme';

export function LoginForm() {
  const router = useRouter();
  const authError = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const signIn = useAuthStore((state) => state.signIn);
  const status = useAuthStore((state) => state.status);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const isBusy = isSubmitting || status === 'loading';
  const inlineAuthError =
    !errors.email?.message && !errors.password?.message ? authError ?? undefined : undefined;

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    await signIn({
      email: values.email.trim().toLowerCase(),
      password: values.password.trim(),
    });
  });

  const footer = (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        clearError();
        router.push('/register' as never);
      }}
      style={({ pressed }) => [styles.linkRow, pressed ? styles.linkPressed : null]}
    >
      <ArrowRight color={theme.colors.info} size={15} strokeWidth={2.2} />
      <Text style={styles.linkText}>אין לך חשבון? הרשמה</Text>
    </Pressable>
  );

  const hero = (
    <View style={styles.brandHeader}>
      <View pointerEvents="none" style={styles.brandGlowPrimary} />
      <View pointerEvents="none" style={styles.brandGlowSecondary} />

      <View style={styles.brandContent}>
        <Text style={styles.brandLinePrimary}>זרוע יישובים מג״ב דרום</Text>
        <Text style={styles.brandLineSecondary}>מערכת אימונים וניהול</Text>
        <Text style={styles.brandSubtitle}>
          סביבת התחברות מאובטחת לכוחות וגורמי ניהול
        </Text>
      </View>
    </View>
  );

  return (
    <AuthScreenShell
      badgeCaption="גישה מבוקרת"
      badgeLabel="מערכת מאובטחת"
      cardDescription="יש להזין פרטי גישה לחשבון מאושר במערכת."
      cardTitle="פרטי הזדהות"
      compact
      eyebrow={null}
      headerAlign="center"
      footer={footer}
      hero={hero}
      subtitle="גישה למשתמשים מורשים בלבד"
      title="כניסה למערכת"
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              appearance="auth"
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
              placeholder='הזינו דוא"ל'
              returnKeyType="next"
              textAlign="left"
              textContentType="username"
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
              appearance="auth"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              errorMessage={errors.password?.message ?? inlineAuthError}
              icon={<Lock />}
              label="סיסמה"
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              placeholder="סיסמה"
              returnKeyType="done"
              secureTextEntry
              textAlign="left"
              textContentType="password"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        <View style={styles.actions}>
          <AuthSubmitButton
            disabled={isBusy}
            label="התחברות"
            loading={isBusy}
            onPress={() => {
              void onSubmit();
            }}
          />

          <View style={styles.securityRow}>
            <Shield color={theme.colors.textMuted} size={14} strokeWidth={2.1} />
            <Text style={styles.securityText}>גישה מאובטחת • מערכת פנימית</Text>
          </View>
        </View>
      </View>
    </AuthScreenShell>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  brandContent: {
    alignItems: 'center',
    gap: 7,
    maxWidth: 360,
  },
  brandGlowPrimary: {
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 180,
    height: 160,
    opacity: 0.72,
    position: 'absolute',
    right: 34,
    top: -26,
    width: 160,
  },
  brandGlowSecondary: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 160,
    bottom: -18,
    height: 124,
    left: 48,
    opacity: 0.44,
    position: 'absolute',
    width: 124,
  },
  brandHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.separator,
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: 154,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  brandLinePrimary: {
    ...theme.typography.eyebrow,
    color: theme.colors.accentStrong,
    fontSize: 12,
    letterSpacing: 1,
    lineHeight: 16,
    textAlign: 'center',
  },
  brandLineSecondary: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
  },
  brandSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    maxWidth: 310,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  linkPressed: {
    opacity: 0.76,
  },
  linkRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  linkText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
    letterSpacing: 0.1,
    textAlign: 'center',
  },
}));
