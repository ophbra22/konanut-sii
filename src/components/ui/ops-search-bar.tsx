import { Search } from 'lucide-react-native';
import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { theme } from '@/src/theme';

type OpsSearchBarProps = TextInputProps & {
  placeholder: string;
};

export function OpsSearchBar({
  placeholder,
  style,
  ...props
}: OpsSearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <Search color={theme.colors.textMuted} size={18} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
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
    fontSize: 16,
    minHeight: 56,
    writingDirection: 'rtl',
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 22, 27, 0.96)',
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
  },
});
