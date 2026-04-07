import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AppTextField } from '@/src/components/ui/app-text-field';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import { AuthUtilityLinks } from '@/src/features/auth/components/auth-utility-links';
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
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });
  const passwordInputRef = useRef<TextInput>(null);

  const isBusy = isSubmitting || status === 'loading';
  const inlineAuthError =
    !errors.email?.message && !errors.password?.message ? authError ?? undefined : undefined;

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    const result = await signIn({
      email: values.email.trim().toLowerCase(),
      password: values.password.trim(),
    });

    if (!result.success && result.reason === 'invalid_credentials') {
      resetField('password', {
        defaultValue: '',
      });

      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }
  });

  const footer = (
    <View style={styles.footerContent}>
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

      <AuthUtilityLinks />
    </View>
  );

  const hero = (
    <View style={styles.brandHeader}>
      <View pointerEvents="none" style={styles.brandGlowPrimary} />
      <View pointerEvents="none" style={styles.brandGlowSecondary} />
      <View pointerEvents="none" style={styles.brandGlowCore} />

      <View style={styles.brandContent}>
        <Text style={styles.brandLinePrimary}>זרוע יישובים מג״ב דרום</Text>
        <View style={styles.brandTitleWrap}>
          <View pointerEvents="none" style={styles.brandTitleGlow} />
          <Text numberOfLines={1} style={styles.brandLineSecondary}>
            מערכת אימונים וניהול
          </Text>
        </View>
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
              inputRef={passwordInputRef}
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
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              clearError();
              router.push('/forgot-password' as never);
            }}
            style={({ pressed }) => [
              styles.secondaryLinkRow,
              pressed ? styles.linkPressed : null,
            ]}
          >
            <Text style={styles.secondaryLinkText}>שכחתי סיסמה</Text>
          </Pressable>

          <AuthSubmitButton
            compact
            disabled={isBusy}
            label="התחברות"
            loading={isBusy}
            onPress={() => {
              void onSubmit();
            }}
          />
        </View>
      </View>
    </AuthScreenShell>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actions: {
    gap: 10,
    marginTop: 2,
  },
  brandContent: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 384,
  },
  brandGlowCore: {
    backgroundColor: theme.colors.glowMuted,
    borderRadius: 220,
    height: 180,
    opacity: 0.7,
    position: 'absolute',
    top: 8,
    width: 240,
  },
  brandGlowPrimary: {
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 180,
    height: 160,
    opacity: 0.58,
    position: 'absolute',
    right: 18,
    top: -10,
    width: 160,
  },
  brandGlowSecondary: {
    backgroundColor: theme.colors.glowStrong,
    borderRadius: 160,
    bottom: -8,
    height: 124,
    left: 36,
    opacity: 0.34,
    position: 'absolute',
    width: 124,
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 2,
    position: 'relative',
  },
  brandLinePrimary: {
    ...theme.typography.eyebrow,
    color: theme.colors.accentStrong,
    fontSize: 20,
    letterSpacing: 0.2,
    lineHeight: 24,
    textAlign: 'center',
  },
  brandLineSecondary: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 27,
    textAlign: 'center',
  },
  brandSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    maxWidth: 308,
    textAlign: 'center',
  },
  brandTitleGlow: {
    backgroundColor: theme.colors.infoSurface,
    borderRadius: 999,
    height: 78,
    opacity: 0.72,
    position: 'absolute',
    width: 250,
  },
  brandTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 16,
    position: 'relative',
  },
  footerContent: {
    alignItems: 'center',
    gap: 8,
  },
  form: {
    gap: 12,
  },
  linkPressed: {
    opacity: 0.76,
  },
  linkRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  linkText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryLinkRow: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    marginBottom: 2,
  },
  secondaryLinkText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
}));
