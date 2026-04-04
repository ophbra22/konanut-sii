import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail, Shield } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTextField } from '@/src/components/ui/app-text-field';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import {
  loginSchema,
  type LoginFormValues,
} from '@/src/features/auth/schemas/login-schema';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

const LOGIN_BANNER = require('../../../../assets/images/login-mgdb-darom.jpeg');

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
    <View style={styles.heroCard}>
      <Image resizeMode="cover" source={LOGIN_BANNER} style={styles.heroImage} />
      <View pointerEvents="none" style={styles.heroImageGlow} />
      <View pointerEvents="none" style={styles.heroOverlay} />
      <View style={styles.heroCaption}>
        <Text style={styles.heroKicker}>זרוע יישובים מג"ב דרום</Text>
        <Text style={styles.heroCaptionTitle}>מערכת אימונים וגישה מבצעית</Text>
        <Text style={styles.heroCaptionText}>סביבת התחברות מאובטחת לכוחות וגורמי ניהול</Text>
      </View>
    </View>
  );

  return (
    <AuthScreenShell
      badgeLabel="מערכת מאובטחת"
      cardDescription="גישה לחשבון הארגוני המאושר במערכת."
      cardTitle="פרטי הזדהות"
      compact
      footer={footer}
      hero={hero}
      subtitle="הזינו את פרטי הגישה למערכת."
      title="כניסה למערכת אימונים"
    >
      <View style={styles.form}>
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
              placeholder="הזינו סיסמה"
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
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.lg,
  },
  heroCaption: {
    bottom: theme.spacing.lg,
    gap: 3,
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
  },
  heroCaptionText: {
    ...theme.typography.caption,
    color: theme.colors.textOnMediaSecondary,
    textAlign: 'right',
  },
  heroCaptionTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  heroCard: {
    ...theme.elevation.hero,
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.accentBorder,
    borderRadius: 26,
    borderWidth: 1,
    minHeight: 124,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    height: 126,
    width: '100%',
  },
  heroImageGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.mediaGlow,
  },
  heroKicker: {
    ...theme.typography.meta,
    color: theme.colors.accentStrong,
    textAlign: 'right',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.heroOverlay,
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
}));
