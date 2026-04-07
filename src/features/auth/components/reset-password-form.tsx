import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import { AuthUtilityLinks } from '@/src/features/auth/components/auth-utility-links';
import {
  signOutPasswordRecoverySession,
  updatePassword,
} from '@/src/features/auth/api/password-reset-service';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/src/features/auth/schemas/reset-password-schema';
import { getPresentableErrorMessage } from '@/src/lib/error-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  createThemedStyles,
  theme,
  type AppTheme,
} from '@/src/theme';

export function ResetPasswordForm() {
  const router = useRouter();
  const clearPasswordRecoveryState = useAuthStore(
    (state) => state.clearPasswordRecoveryState
  );
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);
  const passwordRecoveryError = useAuthStore((state) => state.passwordRecoveryError);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const footer = (
    <View style={styles.footerContent}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          clearPasswordRecoveryState();
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

  const recoveryState = useMemo(() => {
    if (passwordRecoveryError) {
      return {
        isReady: false,
        message: passwordRecoveryError,
      };
    }

    if (isPasswordRecovery && session) {
      return {
        isReady: true,
        message: null,
      };
    }

    return {
      isReady: false,
      message: 'קישור איפוס הסיסמה אינו תקין או שפג תוקפו',
    };
  }, [isPasswordRecovery, passwordRecoveryError, session]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await updatePassword(values.password);
      await signOutPasswordRecoverySession();
      clearPasswordRecoveryState();
      reset();
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(getPresentableErrorMessage(error, 'לא ניתן לעדכן את הסיסמה'));
    }
  });

  if (status === 'loading' && !isPasswordRecovery && !passwordRecoveryError) {
    return <AppLoader label="מאמת את קישור האיפוס..." />;
  }

  if (isSuccess) {
    return (
      <AuthScreenShell
        badgeCaption="גישה מחודשת"
        badgeLabel="הסיסמה עודכנה"
        cardDescription="הסיסמה נשמרה בהצלחה. עכשיו ניתן להתחבר מחדש עם הסיסמה החדשה."
        cardTitle="האיפוס הושלם"
        compact
        footer={footer}
        subtitle="הגישה לחשבון עודכנה בהצלחה."
        title="סיסמה חדשה"
      >
        <View style={styles.successState}>
          <View style={styles.successIcon}>
            <ShieldCheck color={theme.colors.accentStrong} size={26} strokeWidth={2.2} />
          </View>
          <Text style={styles.successTitle}>הסיסמה עודכנה בהצלחה</Text>
          <Text style={styles.successDescription}>
            אפשר לחזור למסך ההתחברות ולהמשיך עם הסיסמה החדשה.
          </Text>
        </View>
      </AuthScreenShell>
    );
  }

  if (!recoveryState.isReady) {
    return (
      <AuthScreenShell
        badgeCaption="קישור חד-פעמי"
        badgeLabel="נדרש קישור תקין"
        cardDescription="כדי להגדיר סיסמה חדשה יש לפתוח את קישור האיפוס שנשלח לתיבת הדוא״ל."
        cardTitle="לא ניתן לפתוח את האיפוס"
        compact
        footer={footer}
        subtitle="יש לפתוח מחדש את קישור האיפוס מהמייל."
        title="סיסמה חדשה"
      >
        <View style={styles.invalidState}>
          <Text style={styles.invalidTitle}>לא ניתן להמשיך בתהליך האיפוס</Text>
          <Text style={styles.invalidDescription}>{recoveryState.message}</Text>
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      badgeCaption="קישור חד-פעמי"
      badgeLabel="איפוס מאומת"
      cardDescription="יש לבחור סיסמה חדשה לחשבון. לאחר השמירה ניתן יהיה להתחבר מחדש כרגיל."
      cardTitle="הגדרת סיסמה חדשה"
      compact
      footer={footer}
      subtitle="בחרו סיסמה חדשה והשלימו את תהליך האיפוס."
      title="סיסמה חדשה"
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              appearance="auth"
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              errorMessage={errors.password?.message}
              icon={<Lock />}
              label="סיסמה חדשה"
              onBlur={onBlur}
              onChangeText={(text) => {
                setSubmitError(null);
                onChange(text);
              }}
              placeholder="בחרו סיסמה חדשה"
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
              appearance="auth"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              errorMessage={errors.password_confirmation?.message ?? submitError ?? undefined}
              icon={<Lock />}
              label="אימות סיסמה"
              onBlur={onBlur}
              onChangeText={(text) => {
                setSubmitError(null);
                onChange(text);
              }}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              placeholder="הזינו שוב את הסיסמה החדשה"
              returnKeyType="done"
              secureTextEntry
              textAlign="left"
              textContentType="password"
              value={value}
              writingDirection="ltr"
            />
          )}
        />

        <AuthSubmitButton
          compact
          disabled={isSubmitting}
          label="שמירת סיסמה חדשה"
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
  invalidDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  invalidState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  invalidTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
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
  successDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
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
