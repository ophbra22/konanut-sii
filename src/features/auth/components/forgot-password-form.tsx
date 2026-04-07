import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AppTextField } from '@/src/components/ui/app-text-field';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import { AuthUtilityLinks } from '@/src/features/auth/components/auth-utility-links';
import { requestPasswordReset } from '@/src/features/auth/api/password-reset-service';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/src/features/auth/schemas/forgot-password-schema';
import { getPresentableErrorMessage } from '@/src/lib/error-utils';
import {
  createThemedStyles,
  theme,
  type AppTheme,
} from '@/src/theme';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const emailValue = watch('email');
  const footer = (
    <View style={styles.footerContent}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          router.replace('/login' as never);
        }}
        style={({ pressed }) => [styles.linkRow, pressed ? styles.linkPressed : null]}
      >
        <ArrowRight color={theme.colors.info} size={15} strokeWidth={2.2} />
        <Text style={styles.linkText}>חזרה למסך ההתחברות</Text>
      </Pressable>

      <AuthUtilityLinks />
    </View>
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await requestPasswordReset(values.email.trim().toLowerCase());
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(getPresentableErrorMessage(error, 'לא ניתן לשלוח בקשת איפוס כעת'));
    }
  });

  if (isSuccess) {
    return (
      <AuthScreenShell
        badgeCaption="קישור חד-פעמי"
        badgeLabel="נשלח מייל מאובטח"
        cardDescription="שלחנו קישור לאיפוס הסיסמה לכתובת שהוזנה. יש לפתוח את המייל מאותו מכשיר או להמשיך ממנו לאפליקציה."
        cardTitle="בדקו את תיבת הדוא״ל"
        compact
        footer={footer}
        subtitle="נשלח קישור מאובטח להגדרת סיסמה חדשה."
        title="איפוס סיסמה"
      >
        <View style={styles.successState}>
          <View style={styles.successIcon}>
            <ShieldCheck color={theme.colors.accentStrong} size={26} strokeWidth={2.2} />
          </View>
          <Text style={styles.successTitle}>נשלח אליך מייל לאיפוס הסיסמה</Text>
          <Text style={styles.successDescription}>
            אם קיימת כתובת דוא״ל תואמת במערכת, יישלח אליה קישור מאובטח להגדרת סיסמה חדשה.
          </Text>
          {emailValue.trim() ? (
            <Text style={styles.successEmail}>{emailValue.trim().toLowerCase()}</Text>
          ) : null}
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      badgeCaption="שחזור גישה"
      badgeLabel="סיוע מאובטח"
      cardDescription="יש להזין את כתובת הדוא״ל של החשבון. נשלח אליה קישור מאובטח להגדרת סיסמה חדשה."
      cardTitle="בקשת איפוס סיסמה"
      compact
      footer={footer}
      subtitle="נשלח קישור מאובטח לכתובת הדוא״ל שהוזנה."
      title="איפוס סיסמה"
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
                setSubmitError(null);
                onChange(text);
              }}
              placeholder='הזינו דוא"ל'
              returnKeyType="done"
              textAlign="left"
              textContentType="emailAddress"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <AuthSubmitButton
          compact
          disabled={isSubmitting}
          label="שליחת קישור איפוס"
          loading={isSubmitting}
          onPress={() => {
            void onSubmit();
          }}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
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
  submitError: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    lineHeight: 18,
    textAlign: 'right',
  },
  successDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  successEmail: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontWeight: '700',
    textAlign: 'center',
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  successState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  successTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
  },
}));
