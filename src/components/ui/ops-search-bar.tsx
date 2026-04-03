import { useState } from 'react';
import { Search } from 'lucide-react-native';
import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { theme } from '@/src/theme';

type OpsSearchBarProps = TextInputProps & {
  placeholder: string;
};

export function OpsSearchBar({
  onBlur,
  onFocus,
  placeholder,
  style,
  ...props
}: OpsSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, isFocused && styles.wrapperFocused]}>
      <Search color={isFocused ? theme.colors.info : theme.colors.textMuted} size={17} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
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
        style={[styles.input, style]}
        textAlign="right"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    writingDirection: 'rtl',
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 19, 24, 0.98)',
    borderColor: theme.colors.borderStrong,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  wrapperFocused: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.info,
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
});
