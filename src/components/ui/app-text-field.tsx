import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/src/theme';

type AppTextFieldProps = TextInputProps & {
  errorMessage?: string;
  hint?: string;
  label: string;
  textAlign?: 'left' | 'right';
  writingDirection?: 'auto' | 'ltr' | 'rtl';
};

export function AppTextField({
  errorMessage,
  hint,
  label,
  onBlur,
  onFocus,
  textAlign = 'right',
  writingDirection = 'rtl',
  ...props
}: AppTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        importantForAutofill="no"
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          {
            textAlign,
            writingDirection,
          },
          errorMessage ? styles.inputError : null,
        ]}
        {...props}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {!errorMessage && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  inputFocused: {
    borderColor: theme.colors.info,
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  wrapper: {
    gap: 8,
  },
});
