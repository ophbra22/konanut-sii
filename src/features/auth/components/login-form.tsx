import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { PageHeader } from '@/src/components/ui/page-header';
import {
  loginSchema,
  type LoginFormValues,
} from '@/src/features/auth/schemas/login-schema';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export function LoginForm() {
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

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    await signIn({
      email: values.email.trim().toLowerCase(),
      password: values.password.trim(),
    });
  });

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
      >
        <PageHeader
          eyebrow="כוננות שיא"
          title="כניסה למערכת"
          subtitle="בסיס התחברות ראשוני ליישום מבצעי בעברית מלאה, עם RTL ותשתית מוכנה להרחבה."
        />

        <AppCard
          title="עקרון דומיין"
          description="במערכת הזו היישוב הוא יחידת הכוננות הראשית. לכל יישוב יש יחידת כוננות אחת, ולכן לא נוצרת ישות squad נפרדת."
          variant="accent"
        />

        <AppCard title="פרטי התחברות" description="המסך מחובר ל־Supabase Auth ומוכן להרחבת הרשאות ופרופילי משתמשים.">
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  label='דוא"ל'
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    clearError();
                    onChange(text);
                  }}
                  placeholder='הזינו דוא"ל'
                  textAlign="left"
                  textContentType="username"
                  value={value}
                  writingDirection="ltr"
                  errorMessage={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                  <AppTextField
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      label="סיסמה"
                      onBlur={onBlur}
                      onChangeText={(text) => {
                          clearError();
                          onChange(text);
                      }}
                      placeholder="הזינו סיסמה"
                      secureTextEntry
                      textAlign="left"
                      textContentType="none"
                      value={value}
                      writingDirection="ltr"
                      errorMessage={errors.password?.message}
                  />
              )}
            />

            {authError ? <Text style={styles.error}>{authError}</Text> : null}

            <AppButton
              disabled={isBusy}
              label={isBusy ? 'מתחבר...' : 'כניסה'}
              loading={isBusy}
              onPress={() => {
                  void onSubmit();
              }}
            />
          </View>
        </AppCard>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  form: {
    gap: theme.spacing.md,
  },
  wrapper: {
    gap: theme.spacing.lg,
  },
});
