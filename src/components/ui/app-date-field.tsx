import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { CalendarDays } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import {
  createThemedStyles,
  theme,
  type AppTheme,
  useAppTheme,
  useThemeMode,
} from '@/src/theme';

type AppDateFieldProps = {
  disabled?: boolean;
  errorMessage?: string;
  hint?: string;
  label: string;
  maximumDate?: Date;
  minimumDate?: Date;
  onChange: (value: string) => void;
  placeholder?: string;
  value?: string;
};

function getPickerDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.toDate() : new Date();
}

function getDisplayValue(value?: string, placeholder?: string) {
  if (!value) {
    return placeholder ?? 'בחרו תאריך';
  }

  const parsed = dayjs(value);

  if (!parsed.isValid()) {
    return placeholder ?? 'בחרו תאריך';
  }

  return parsed.format('DD/MM/YYYY');
}

export function AppDateField({
  disabled = false,
  errorMessage,
  hint,
  label,
  maximumDate,
  minimumDate,
  onChange,
  placeholder,
  value,
}: AppDateFieldProps) {
  const appTheme = useAppTheme();
  const themeMode = useThemeMode();
  const [isOpen, setIsOpen] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState(getPickerDate(value));

  const displayValue = useMemo(
    () => getDisplayValue(value, placeholder),
    [placeholder, value]
  );
  const draftDisplayValue = useMemo(
    () => dayjs(iosDraftDate).format('DD/MM/YYYY'),
    [iosDraftDate]
  );

  const openPicker = () => {
    if (disabled) {
      return;
    }

    const nextDate = getPickerDate(value);
    setIosDraftDate(nextDate);
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
  };

  const commitDate = (nextDate: Date) => {
    onChange(dayjs(nextDate).format('YYYY-MM-DD'));
  };

  const handleNativeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }

    if (event.type !== 'set' || !selectedDate) {
      return;
    }

    if (Platform.OS === 'ios') {
      setIosDraftDate(selectedDate);
      return;
    }

    commitDate(selectedDate);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          errorMessage ? styles.fieldError : null,
          disabled ? styles.fieldDisabled : null,
          pressed && !disabled ? styles.fieldPressed : null,
        ]}
      >
        <CalendarDays color={theme.colors.textMuted} size={18} />
        <Text
          style={[
            styles.value,
            !value ? styles.placeholder : null,
          ]}
        >
          {displayValue}
        </Text>
      </Pressable>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {!errorMessage && hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {Platform.OS === 'android' && isOpen ? (
        <DateTimePicker
          display="calendar"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode="date"
          onChange={handleNativeChange}
          positiveButton={{
            label: 'אישור',
            textColor: appTheme.colors.info,
          }}
          negativeButton={{
            label: 'ביטול',
            textColor: appTheme.colors.textSecondary,
          }}
          title="בחירת תאריך"
          value={getPickerDate(value)}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          animationType="fade"
          onRequestClose={closePicker}
          transparent
          visible={isOpen}
        >
          <View style={styles.modalOverlay}>
            <Pressable onPress={closePicker} style={StyleSheet.absoluteFillObject} />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>בחירת תאריך</Text>
                <Text style={styles.modalSubtitle}>יש לבחור יום מתאים ולאשר את הבחירה</Text>
                <View style={styles.selectedDateBadge}>
                  <Text style={styles.selectedDateBadgeText}>{draftDisplayValue}</Text>
                </View>
              </View>

              <View style={styles.pickerShell}>
                <DateTimePicker
                  accentColor={appTheme.colors.info}
                  display="inline"
                  locale="he-IL"
                  maximumDate={maximumDate}
                  minimumDate={minimumDate}
                  mode="date"
                  onChange={handleNativeChange}
                  textColor={appTheme.colors.textPrimary}
                  themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                  value={iosDraftDate}
                />
              </View>

              <View style={styles.modalActions}>
                <AppButton
                  fullWidth={false}
                  label="ביטול"
                  onPress={closePicker}
                  style={styles.modalAction}
                  variant="ghost"
                />
                <AppButton
                  fullWidth={false}
                  label="אישור"
                  onPress={() => {
                    commitDate(iosDraftDate);
                    closePicker();
                  }}
                  style={styles.modalAction}
                  variant="secondary"
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
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
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  fieldError: {
    borderColor: theme.colors.danger,
  },
  fieldPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  modalAction: {
    flex: 1,
  },
  modalActions: {
    borderTopColor: theme.colors.separator,
    borderTopWidth: 1,
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  modalCard: {
    ...theme.elevation.card,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    width: '100%',
  },
  modalHeader: {
    gap: 6,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: theme.colors.modalBackdrop,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  modalTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  pickerShell: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  selectedDateBadge: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedDateBadgeText: {
    ...theme.typography.badge,
    color: theme.colors.info,
    textAlign: 'center',
  },
  value: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  wrapper: {
    gap: theme.spacing.xs,
  },
}));
