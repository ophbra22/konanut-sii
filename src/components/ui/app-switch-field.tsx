import { StyleSheet, Switch, Text, View } from 'react-native';

import { theme } from '@/src/theme';

type AppSwitchFieldProps = {
  description?: string;
  disabled?: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

export function AppSwitchField({
  description,
  disabled = false,
  label,
  onValueChange,
  value,
}: AppSwitchFieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <Switch
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={value ? theme.colors.accentStrong : theme.colors.textMuted}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.overlay,
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
});
