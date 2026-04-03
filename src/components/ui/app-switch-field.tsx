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
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
