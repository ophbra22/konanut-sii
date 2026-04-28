import { useRouter } from 'expo-router';
import { ArrowRight, KeyRound, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppChip } from '@/src/components/ui/app-chip';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { SettlementPicker } from '@/src/components/ui/settlement-picker';
import { AuthScreenShell } from '@/src/features/auth/components/auth-screen-shell';
import { AuthSubmitButton } from '@/src/features/auth/components/auth-submit-button';
import { AuthUtilityLinks } from '@/src/features/auth/components/auth-utility-links';
import { AuthBrandHero } from '@/src/features/auth/components/auth-brand-hero';
import {
  listEmailRegistrationOptions,
  normalizeEmailAddress,
  type RegistrationOptions,
} from '@/src/features/auth/api/email-auth-service';
import {
  EMAIL_OTP_MAX_LENGTH,
  MIN_PASSWORD_LENGTH,
  isValidEmailOtpToken,
  sanitizeOtpInput,
} from '@/src/features/auth/lib/auth-constants';
import {
  registrationRoleOptions,
  requiresPlagaAssignment,
  requiresRegionalCouncilAssignment,
  requiresSettlementAssignment,
} from '@/src/features/auth/lib/permissions';
import { PLAGA_VALUES } from '@/src/lib/plaga';
import { rtlRow, rtlRowReverse } from '@/src/lib/rtl';
import { useAuthStore } from '@/src/stores/auth-store';
import type { UserRole } from '@/src/types/database';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

export function RegisterForm() {
  const router = useRouter();
  const authError = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const completeEmailRegistrationWithPassword = useAuthStore(
    (state) => state.completeEmailRegistrationWithPassword
  );
  const sendEmailOtp = useAuthStore((state) => state.sendEmailOtp);
  const signInWithEmailOtp = useAuthStore((state) => state.signInWithEmailOtp);
  const sessionEmail = useAuthStore((state) => state.user?.email ?? state.session?.user.email ?? null);
  const status = useAuthStore((state) => state.status);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [options, setOptions] = useState<RegistrationOptions>({
    councils: [],
    settlements: [],
  });
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [requestedCouncilId, setRequestedCouncilId] = useState<string | null>(null);
  const [requestedPlagaId, setRequestedPlagaId] = useState<string | null>(null);
  const [requestedRole, setRequestedRole] = useState<UserRole>('razar');
  const [requestedSettlementId, setRequestedSettlementId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

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
    if (status !== 'needs_registration') {
      return;
    }

    void listEmailRegistrationOptions()
      .then(setOptions)
      .catch(() => {
        setOptions({ councils: [], settlements: [] });
      });
  }, [status]);

  useEffect(() => {
    if (status !== 'needs_registration' || !sessionEmail) {
      return;
    }

    setEmail((current) => current || sessionEmail);
    setVerifiedEmail((current) => current || sessionEmail);
  }, [sessionEmail, status]);

  const isBusy = isSendingCode || isVerifyingCode || isCompletingRegistration || status === 'loading';
  const displayedError = fieldError ?? authError;
  const isRegistrationStage = status === 'needs_registration';
  const normalizedEmail = useMemo(() => {
    try {
      return normalizeEmailAddress(email);
    } catch {
      return null;
    }
  }, [email]);
  const isCodeComplete = isValidEmailOtpToken(code);
  const selectedRoleRequiresSettlement = requiresSettlementAssignment(requestedRole);
  const selectedRoleRequiresCouncil = requiresRegionalCouncilAssignment(requestedRole);
  const selectedRoleRequiresPlaga = requiresPlagaAssignment(requestedRole);
  const filteredSettlements = useMemo(() => {
    if (!requestedCouncilId) {
      return options.settlements;
    }

    return options.settlements.filter((settlement) => settlement.council_id === requestedCouncilId);
  }, [options.settlements, requestedCouncilId]);

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
      setFieldError('יש להזין את הקוד שנשלח למייל');
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

      if (result.reason !== 'needs_registration') {
        setSuccessMessage('החשבון כבר פעיל. מעביר למסך הראשי...');
        router.replace('/dashboard' as never);
        return;
      }

      setSuccessMessage('האימייל אומת בהצלחה. עכשיו מגדירים סיסמה ומשלימים את הבקשה');
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function handleCompleteRegistration() {
    clearError();
    setFieldError(null);
    setSuccessMessage(null);

    if (fullName.trim().length < 2) {
      setFieldError('יש להזין שם מלא');
      return;
    }

    if (password.trim().length < MIN_PASSWORD_LENGTH) {
      setFieldError(`יש לבחור סיסמה באורך ${MIN_PASSWORD_LENGTH} תווים לפחות`);
      return;
    }

    if (password !== passwordConfirmation) {
      setFieldError('אימות הסיסמה אינו תואם');
      return;
    }

    if (selectedRoleRequiresSettlement && !requestedSettlementId) {
      setFieldError('יש לבחור יישוב עבור התפקיד המבוקש');
      return;
    }

    if (selectedRoleRequiresCouncil && !requestedCouncilId) {
      setFieldError('יש לבחור מועצה עבור התפקיד המבוקש');
      return;
    }

    if (selectedRoleRequiresPlaga && !requestedPlagaId) {
      setFieldError('יש לבחור פלגה עבור התפקיד המבוקש');
      return;
    }

    setIsCompletingRegistration(true);

    try {
      const result = await completeEmailRegistrationWithPassword({
        fullName,
        password,
        requestedCouncilId: selectedRoleRequiresCouncil ? requestedCouncilId : null,
        requestedPlagaId: selectedRoleRequiresPlaga ? requestedPlagaId : null,
        requestedRole,
        requestedSettlementId: selectedRoleRequiresSettlement ? requestedSettlementId : null,
      });

      if (!result.success) {
        setFieldError(result.message ?? 'לא ניתן להשלים את ההרשמה');
        return;
      }

      setIsSuccess(true);
    } finally {
      setIsCompletingRegistration(false);
    }
  }

  const footer = (
    <View style={styles.footerContent}>
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

      <AuthUtilityLinks />
    </View>
  );

  if (isSuccess) {
    return (
      <AuthScreenShell
        badgeCaption="ממתין לאישור מנהל"
        badgeLabel="ההרשמה הושלמה"
        cardDescription="פרטי הגישה נשמרו בהצלחה. לאחר אישור החשבון על ידי מנהל מערכת, יהיה אפשר להתחבר גם עם סיסמה וגם עם קוד חד-פעמי למייל."
        cardTitle="הבקשה נקלטה במערכת"
        compact
        footer={footer}
        hero={
          <AuthBrandHero
            subtitle="מערכת מאובטחת לניהול אימונים, כוננות ודירוגי יישובים"
            title="כוננות שיא"
          />
        }
        subtitle="גישה למערכת מופעלת רק לאחר אישור מנהל"
        title="הרשמה למערכת"
      >
        <View style={styles.successState}>
          <View style={styles.successIcon}>
            <ShieldCheck color={theme.colors.accentStrong} size={26} strokeWidth={2.2} />
          </View>
          <Text style={styles.successTitle}>החשבון הוגדר וממתין לאישור</Text>
          <Text style={styles.successDescription}>
            לאחר אישור החשבון יהיה ניתן להתחבר עם אותה סיסמה שהוגדרה עכשיו, או עם קוד חד-פעמי למייל.
          </Text>
        </View>
      </AuthScreenShell>
    );
  }

  if (!isRegistrationStage) {
    return (
      <AuthScreenShell
        badgeCaption="שלב 1 מתוך 2"
        badgeLabel="אימות מייל"
        cardDescription="קודם מאמתים את כתובת האימייל עם קוד חד-פעמי, ורק אחר כך מגדירים סיסמה ומשלימים את פרטי הבקשה."
        cardTitle="הרשמה עם אימייל"
        compact
        footer={footer}
        hero={
          <AuthBrandHero
            subtitle="יצירת חשבון חדש למערכת המבצעית תחת אימות מייל ואישור מנהל"
            title="כוננות שיא"
          />
        }
        subtitle="קוד חד-פעמי יישלח לכתובת האימייל שהוזנה"
        title="בקשת הרשמה למערכת"
      >
        <View style={styles.form}>
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
            editable={!verifiedEmail}
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
            returnKeyType="send"
            textAlign="right"
            textContentType="emailAddress"
            value={email}
            writingDirection="ltr"
          />

          {verifiedEmail ? (
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

          {verifiedEmail ? (
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
                if (isCodeComplete) {
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
            {!verifiedEmail ? (
              <AuthSubmitButton
                compact
                disabled={!normalizedEmail || isBusy || countdown > 0}
                label="שלח קוד אימות"
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
                  disabled={!isCodeComplete || isBusy}
                  label="אמת והמשך"
                  loading={isVerifyingCode}
                  loadingLabel="מאמת..."
                  onPress={() => {
                    void handleVerifyCode();
                  }}
                />
              </>
            )}
          </View>
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      badgeCaption="שלב 2 מתוך 2"
      badgeLabel="השלמת חשבון"
      cardDescription="האימייל אומת. עכשיו מגדירים סיסמה קבועה ומשלימים את פרטי בקשת הגישה כדי להעביר את החשבון לאישור מנהל."
      cardTitle="הגדרת סיסמה ופרטי גישה"
      footer={footer}
      hero={
        <AuthBrandHero
          subtitle="השלמת הרשמה מאובטחת למערכת המבצעית"
          title="כוננות שיא"
        />
      }
      subtitle="לאחר שליחת הבקשה החשבון ימתין לאישור מנהל"
      title="בקשת הרשמה למערכת"
    >
      <View style={styles.form}>
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

        <View style={styles.emailSummary}>
          <Text style={styles.emailSummaryLabel}>אימייל מאומת</Text>
          <Text numberOfLines={1} style={styles.emailSummaryValue}>
            {verifiedEmail ?? sessionEmail ?? email}
          </Text>
        </View>

        <AppTextField
          appearance="auth"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          errorMessage={undefined}
          icon={<Lock />}
          label="סיסמה"
          onChangeText={(text) => {
            clearError();
            setFieldError(null);
            setPassword(text);
          }}
          placeholder={`לפחות ${MIN_PASSWORD_LENGTH} תווים`}
          returnKeyType="next"
          secureTextEntry
          textAlign="right"
          textContentType="newPassword"
          value={password}
          writingDirection="ltr"
        />

        <AppTextField
          appearance="auth"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          errorMessage={undefined}
          icon={<Lock />}
          label="אימות סיסמה"
          onChangeText={(text) => {
            clearError();
            setFieldError(null);
            setPasswordConfirmation(text);
          }}
          placeholder="הזינו שוב את הסיסמה"
          returnKeyType="next"
          secureTextEntry
          textAlign="right"
          textContentType="newPassword"
          value={passwordConfirmation}
          writingDirection="ltr"
        />

        <AppTextField
          appearance="auth"
          autoCapitalize="words"
          autoComplete="name"
          errorMessage={undefined}
          icon={<UserRound />}
          label="שם מלא"
          onChangeText={(text) => {
            clearError();
            setFieldError(null);
            setFullName(text);
          }}
          placeholder="הזינו שם מלא"
          returnKeyType="next"
          textContentType="name"
          value={fullName}
        />

        <View style={styles.selectionField}>
          <Text style={styles.selectionLabel}>תפקיד מבוקש</Text>
          <View style={styles.selectionChips}>
            {registrationRoleOptions.map((option) => {
              const isSelected = requestedRole === option.value;

              return (
                <AppChip
                  key={option.value}
                  label={option.label}
                  onPress={() => {
                    clearError();
                    setFieldError(null);
                    setRequestedRole(option.value);
                    setRequestedCouncilId(null);
                    setRequestedPlagaId(null);
                    setRequestedSettlementId(null);
                  }}
                  selected={isSelected}
                  tone={isSelected ? 'accent' : 'neutral'}
                />
              );
            })}
          </View>
        </View>

        {selectedRoleRequiresCouncil ? (
          <View style={styles.selectionField}>
            <Text style={styles.selectionLabel}>מועצה מבוקשת</Text>
            <View style={styles.selectionChips}>
              {options.councils.map((council) => {
                const isSelected = requestedCouncilId === council.id;

                return (
                  <AppChip
                    key={council.id}
                    label={council.name}
                    onPress={() => {
                      clearError();
                      setFieldError(null);
                      setRequestedCouncilId(council.id);
                    }}
                    selected={isSelected}
                    tone={isSelected ? 'accent' : 'neutral'}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {selectedRoleRequiresSettlement ? (
          <View style={styles.selectionField}>
            <SettlementPicker
              label="יישוב מבוקש"
              onChange={(settlementIds) => {
                clearError();
                setFieldError(null);
                setRequestedSettlementId(settlementIds[0] ?? null);
              }}
              placeholder="בחר יישוב"
              selectedSettlementIds={requestedSettlementId ? [requestedSettlementId] : []}
              settlements={filteredSettlements}
            />
          </View>
        ) : null}

        {selectedRoleRequiresPlaga ? (
          <View style={styles.selectionField}>
            <Text style={styles.selectionLabel}>פלגה מבוקשת</Text>
            <View style={styles.selectionChips}>
              {PLAGA_VALUES.map((plaga) => {
                const isSelected = requestedPlagaId === plaga;

                return (
                  <AppChip
                    key={plaga}
                    label={plaga}
                    onPress={() => {
                      clearError();
                      setFieldError(null);
                      setRequestedPlagaId(plaga);
                    }}
                    selected={isSelected}
                    tone={isSelected ? 'accent' : 'neutral'}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        <AuthSubmitButton
          disabled={isCompletingRegistration}
          label="השלמת הרשמה"
          loading={isCompletingRegistration}
          loadingLabel="שומר פרטים..."
          onPress={() => {
            void handleCompleteRegistration();
          }}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actions: {
    gap: theme.spacing.sm,
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
  emailSummary: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  emailSummaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  emailSummaryValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
  },
  footerContent: {
    alignItems: 'center',
    gap: 8,
  },
  form: {
    gap: theme.spacing.md,
  },
  linkPressed: {
    opacity: 0.82,
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
    marginTop: -4,
  },
  secondaryLinkText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  selectionChips: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  selectionField: {
    gap: theme.spacing.xs,
  },
  selectionLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
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
  successText: {
    ...theme.typography.caption,
    color: theme.colors.accentStrong,
    fontWeight: '700',
    textAlign: 'right',
  },
  successTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
  },
}));
