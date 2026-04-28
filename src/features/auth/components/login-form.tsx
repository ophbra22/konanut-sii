import { useRouter } from 'expo-router';
import { ArrowRight, KeyRound, Lock, Mail } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppTextField } from '@/src/components/ui/app-text-field';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import { AuthUtilityLinks } from '@/src/features/auth/components/auth-utility-links';
import { AuthBrandHero } from '@/src/features/auth/components/auth-brand-hero';
import { normalizeEmailAddress } from '@/src/features/auth/api/email-auth-service';
import {
  EMAIL_OTP_MAX_LENGTH,
  MIN_PASSWORD_LENGTH,
  getPasswordMinLengthMessage,
  isValidEmailOtpToken,
  sanitizeOtpInput,
} from '@/src/features/auth/lib/auth-constants';
import { rtlRowReverse } from '@/src/lib/rtl';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type LoginMethod = 'otp' | 'password';

function getNormalizedEmailOrNull(value: string) {
  try {
    return normalizeEmailAddress(value);
  } catch {
    return null;
  }
}

function getCardCopy(method: LoginMethod, isOtpSent: boolean) {
  if (method === 'password') {
    return {
      badgeCaption: 'גישה מלאה למורשים בלבד',
      badgeLabel: 'כניסה מאובטחת',
      cardDescription: 'הזינו אימייל וסיסמה כדי להמשיך למערכת המבצעית.',
      cardTitle: 'כניסה עם סיסמה',
      subtitle: 'כניסה מאובטחת למשתמשים פעילים ומאושרים',
    };
  }

  if (isOtpSent) {
    return {
      badgeCaption: 'קוד חד-פעמי פעיל',
      badgeLabel: 'אימות מייל',
      cardDescription: 'הזינו את הקוד שנשלח אליכם למייל כדי להשלים את הכניסה.',
      cardTitle: 'כניסה עם קוד למייל',
      subtitle: 'קוד חד-פעמי נשלח לכתובת שהוזנה',
    };
  }

  return {
    badgeCaption: 'ללא סיסמה',
    badgeLabel: 'כניסה עם קוד למייל',
    cardDescription: 'נשלח קוד חד-פעמי לכתובת האימייל, ולאחר האימות תעברו ישירות למסך הראשי.',
    cardTitle: 'כניסה עם קוד למייל',
    subtitle: 'דרך מהירה ומאובטחת להתחברות',
  };
}

export function LoginForm() {
  const router = useRouter();
  const authError = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const sendEmailOtp = useAuthStore((state) => state.sendEmailOtp);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithEmailOtp = useAuthStore((state) => state.signInWithEmailOtp);
  const status = useAuthStore((state) => state.status);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSigningInWithPassword, setIsSigningInWithPassword] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [countdown]);

  useEffect(() => {
    clearError();
    setFieldError(null);
    setSuccessMessage(null);

    if (loginMethod === 'password') {
      setCode('');
      setVerifiedEmail(null);
      setCountdown(0);
      return;
    }

    setPassword('');
  }, [clearError, loginMethod]);

  const isBusy =
    isSendingCode ||
    isSigningInWithPassword ||
    isVerifyingCode ||
    status === 'loading';
  const displayedError = fieldError ?? authError;
  const normalizedEmail = getNormalizedEmailOrNull(email);
  const isOtpSent = Boolean(verifiedEmail);
  const isCodeComplete = isValidEmailOtpToken(code);
  const canSendCode = Boolean(normalizedEmail) && !isBusy && countdown <= 0;
  const canAttemptPasswordSignIn = !isBusy;
  const canVerifyCode = isOtpSent && isCodeComplete && !isBusy;
  const cardCopy = useMemo(
    () => getCardCopy(loginMethod, isOtpSent),
    [isOtpSent, loginMethod]
  );

  async function handlePasswordSignIn() {
    clearError();
    setFieldError(null);
    setSuccessMessage(null);

    if (!normalizedEmail) {
      setFieldError('יש להזין כתובת אימייל תקינה');
      return;
    }

    if (password.trim().length < MIN_PASSWORD_LENGTH) {
      setFieldError(getPasswordMinLengthMessage());
      return;
    }

    setIsSigningInWithPassword(true);

    try {
      const result = await signIn({
        email: normalizedEmail,
        password: password.trim(),
      });

      if (!result.success) {
        setFieldError(result.message ?? 'לא ניתן להשלים את הכניסה כעת');
        return;
      }

      setSuccessMessage('ההתחברות הושלמה בהצלחה');
    } finally {
      setIsSigningInWithPassword(false);
    }
  }

  async function handleSendCode() {
    clearError();
    setFieldError(null);
    setSuccessMessage(null);

    let emailForOtp: string;

    try {
      emailForOtp = normalizeEmailAddress(email);
    } catch (error) {
      setFieldError(error instanceof Error ? error.message : 'כתובת אימייל לא תקינה');
      return;
    }

    setIsSendingCode(true);

    try {
      const result = await sendEmailOtp(emailForOtp);

      if (!result.success) {
        setFieldError(result.message ?? 'לא ניתן לשלוח קוד אימות כעת');
        return;
      }

      setVerifiedEmail(result.email ?? emailForOtp);
      setCode('');
      setCountdown(60);
      setSuccessMessage('שלחנו קוד חד-פעמי לכתובת האימייל שהוזנה');
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    clearError();
    setFieldError(null);
    setSuccessMessage(null);

    if (!isCodeComplete) {
      setFieldError('יש להזין את הקוד בדיוק כפי שנשלח למייל');
      return;
    }

    setIsVerifyingCode(true);

    try {
      const result = await signInWithEmailOtp({
        email: verifiedEmail ?? email,
        token: code,
      });

      if (!result.success) {
        setFieldError(result.message ?? 'הקוד שגוי או פג תוקף');
        return;
      }

      if (result.reason === 'needs_registration') {
        router.replace('/register' as never);
        return;
      }

      setSuccessMessage('ההתחברות הושלמה בהצלחה');
    } finally {
      setIsVerifyingCode(false);
    }
  }

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
        <Text style={styles.linkText}>אין לך חשבון? להגשת בקשת הרשמה</Text>
      </Pressable>

      <AuthUtilityLinks />
    </View>
  );

  return (
    <AuthScreenShell
      badgeCaption={cardCopy.badgeCaption}
      badgeLabel={cardCopy.badgeLabel}
      cardDescription={cardCopy.cardDescription}
      cardTitle={cardCopy.cardTitle}
      compact
      eyebrow={null}
      footer={footer}
      hero={
        <AuthBrandHero
          subtitle="כניסה מאובטחת למערכת המבצעית לניהול כוננות, אימונים ודירוגי יישובים"
          title="כוננות שיא"
        />
      }
      subtitle={cardCopy.subtitle}
      title="כניסה למערכת"
    >
      <View style={styles.form}>
        <SegmentedControl
          onValueChange={setLoginMethod}
          options={[
            { label: 'כניסה עם סיסמה', value: 'password' },
            { label: 'כניסה עם קוד למייל', value: 'otp' },
          ]}
          value={loginMethod}
        />

        {successMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {displayedError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{displayedError}</Text>
          </View>
        ) : null}

        <AppTextField
          appearance="auth"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!isOtpSent || loginMethod === 'password'}
          errorMessage={undefined}
          icon={<Mail />}
          keyboardType="email-address"
          label="אימייל"
          onChangeText={(text) => {
            clearError();
            setFieldError(null);
            setEmail(text);
          }}
          placeholder="הזינו כתובת אימייל"
          returnKeyType={loginMethod === 'password' ? 'next' : 'send'}
          textAlign="right"
          textContentType="emailAddress"
          value={email}
          writingDirection="ltr"
        />

        {loginMethod === 'password' ? (
          <>
            <AppTextField
              appearance="auth"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              errorMessage={undefined}
              icon={<Lock />}
              label="סיסמה"
              onChangeText={(text) => {
                clearError();
                setFieldError(null);
                setPassword(text);
              }}
              onSubmitEditing={() => {
                if (canAttemptPasswordSignIn) {
                  void handlePasswordSignIn();
                }
              }}
              placeholder="הזינו סיסמה"
              returnKeyType="done"
              secureTextEntry
              textAlign="right"
              textContentType="password"
              value={password}
              writingDirection="ltr"
            />

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
              <Text style={styles.secondaryLinkText}>שכחת סיסמה?</Text>
            </Pressable>

            <AuthSubmitButton
              compact
              disabled={!canAttemptPasswordSignIn}
              label="כניסה עם סיסמה"
              loading={isSigningInWithPassword}
              loadingLabel="מתחבר..."
              onPress={() => {
                void handlePasswordSignIn();
              }}
            />
          </>
        ) : (
          <>
            {isOtpSent ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  clearError();
                  setCode('');
                  setFieldError(null);
                  setSuccessMessage(null);
                  setVerifiedEmail(null);
                  setCountdown(0);
                }}
                style={({ pressed }) => [
                  styles.secondaryLinkRow,
                  pressed ? styles.linkPressed : null,
                ]}
              >
                <Text style={styles.secondaryLinkText}>שינוי כתובת אימייל</Text>
              </Pressable>
            ) : null}

            {isOtpSent ? (
              <AppTextField
              appearance="auth"
              autoComplete="one-time-code"
              icon={<KeyRound />}
              keyboardType="number-pad"
              label="קוד חד-פעמי"
                maxLength={EMAIL_OTP_MAX_LENGTH}
                onChangeText={(text) => {
                  clearError();
                  setFieldError(null);
                  setCode(sanitizeOtpInput(text));
                }}
                onSubmitEditing={() => {
                  if (canVerifyCode) {
                    void handleVerifyCode();
                  }
                }}
                placeholder="הזינו את הקוד שנשלח למייל"
                returnKeyType="done"
                textAlign="right"
                textContentType="oneTimeCode"
                value={code}
                writingDirection="ltr"
              />
            ) : null}

            <View style={styles.actions}>
              {!isOtpSent ? (
                <AuthSubmitButton
                  compact
                  disabled={!canSendCode}
                  label="שלח קוד למייל"
                  loading={isSendingCode}
                  loadingLabel="שולח קוד..."
                  onPress={() => {
                    void handleSendCode();
                  }}
                />
              ) : (
                <>
                  <Pressable
                    accessibilityRole="button"
                    disabled={countdown > 0 || isBusy}
                    onPress={() => {
                      void handleSendCode();
                    }}
                    style={({ pressed }) => [
                      styles.secondaryLinkRow,
                      pressed ? styles.linkPressed : null,
                      countdown > 0 || isBusy ? styles.secondaryLinkDisabled : null,
                    ]}
                  >
                    <Text style={styles.secondaryLinkText}>
                      {countdown > 0
                        ? `שלח קוד מחדש בעוד ${countdown} שניות`
                        : 'שלח קוד מחדש'}
                    </Text>
                  </Pressable>

                  <AuthSubmitButton
                    compact
                    disabled={!canVerifyCode}
                    label="אמת והיכנס"
                    loading={isVerifyingCode}
                    loadingLabel="מאמת..."
                    onPress={() => {
                      void handleVerifyCode();
                    }}
                  />
                </>
              )}
            </View>
          </>
        )}
      </View>
    </AuthScreenShell>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actions: {
    gap: 10,
  },
  errorBanner: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    fontWeight: '700',
    textAlign: 'right',
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
    ...rtlRowReverse,
    gap: theme.spacing.xs,
  },
  linkText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    textAlign: 'center',
  },
  secondaryLinkDisabled: {
    opacity: 0.58,
  },
  secondaryLinkRow: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    marginTop: -2,
  },
  secondaryLinkText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  successBanner: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  successText: {
    ...theme.typography.caption,
    color: theme.colors.accentStrong,
    fontWeight: '700',
    textAlign: 'right',
  },
}));
