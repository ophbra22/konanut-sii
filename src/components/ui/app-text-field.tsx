import {
  cloneElement,
  isValidElement,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type FieldIconElement = ReactElement<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type AppTextFieldProps = TextInputProps & {
  errorMessage?: string;
  hint?: string;
  icon?: FieldIconElement;
  label: string;
  textAlign?: 'left' | 'right';
  writingDirection?: 'auto' | 'ltr' | 'rtl';
};

export function AppTextField({
  errorMessage,
  hint,
  icon,
  label,
  onBlur,
  onFocus,
  textAlign = 'right',
  writingDirection = 'rtl',
  ...props
}: AppTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const iconColor =
    errorMessage && !isFocused
      ? theme.colors.danger
      : isFocused
        ? theme.colors.info
        : theme.colors.textMuted;
  const renderedIcon =
    icon && isValidElement(icon)
      ? cloneElement(icon, {
          color: iconColor,
          size: 18,
          strokeWidth: 2.05,
        })
      : null;
  const isEditable = props.editable !== false;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessible={false}
        disabled={!isEditable}
        onPressIn={() => {
          inputRef.current?.focus();
        }}
        style={[
          styles.field,
          errorMessage ? styles.fieldError : null,
          isFocused ? styles.fieldFocused : null,
          !isEditable ? styles.fieldDisabled : null,
        ]}
      >
        {renderedIcon ? (
          <View
            pointerEvents="none"
            style={[
              styles.iconSlot,
              errorMessage && !isFocused ? styles.iconSlotError : null,
              isFocused ? styles.iconSlotFocused : null,
            ]}
          >
            {renderedIcon}
          </View>
        ) : null}

        <TextInput
          ref={inputRef}
          autoCapitalize="none"
          autoCorrect={false}
          cursorColor={theme.colors.info}
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
          selectionColor={theme.colors.info}
          style={[
            styles.input,
            {
              textAlign,
              writingDirection,
            },
          ]}
          underlineColorAndroid="transparent"
          {...props}
        />
      </Pressable>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {!errorMessage && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    textAlign: 'right',
  },
  field: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
  },
  fieldDisabled: {
    opacity: 0.58,
  },
  fieldError: {
    borderColor: theme.colors.danger,
  },
  fieldFocused: {
    ...theme.elevation.focus,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.info,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  iconSlot: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  iconSlotError: {
    backgroundColor: theme.colors.dangerSurface,
  },
  iconSlotFocused: {
    backgroundColor: theme.colors.infoSurface,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    minHeight: 54,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  wrapper: {
    gap: theme.spacing.xs,
  },
}));
