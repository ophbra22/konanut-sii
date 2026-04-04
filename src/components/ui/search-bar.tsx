import { useRef, useState } from 'react';
import { Search } from 'lucide-react-native';
import type { TextInputProps } from 'react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type SearchBarProps = TextInputProps & {
  placeholder: string;
};

export function SearchBar({
  editable,
  onBlur,
  onFocus,
  placeholder,
  style,
  ...props
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isEditable = editable !== false;

  return (
    <Pressable
      accessible={false}
      disabled={!isEditable}
      onPressIn={() => {
        inputRef.current?.focus();
      }}
      style={[styles.wrapper, isFocused && styles.wrapperFocused, !isEditable && styles.wrapperDisabled]}
    >
      <View pointerEvents="none" style={styles.iconSlot}>
        <Search color={isFocused ? theme.colors.info : theme.colors.textMuted} size={16} />
      </View>
      <TextInput
        ref={inputRef}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        clearButtonMode="while-editing"
        editable={editable}
        enterKeyHint="search"
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"
        selectionColor={theme.colors.info}
        showSoftInputOnFocus
        style={[styles.input, style]}
        textAlign="right"
        underlineColorAndroid="transparent"
        {...props}
      />
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    writingDirection: 'rtl',
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  wrapperDisabled: {
    opacity: 0.56,
  },
  wrapperFocused: {
    ...theme.elevation.focus,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.info,
  },
}));
