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
import { theme } from '@/src/theme';

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
  const [isOpen, setIsOpen] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState(getPickerDate(value));

  const displayValue = useMemo(
    () => getDisplayValue(value, placeholder),
    [placeholder, value]
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
              <Text style={styles.modalTitle}>בחירת תאריך</Text>

              <DateTimePicker
                display="inline"
                locale="he-IL"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                mode="date"
                onChange={handleNativeChange}
                themeVariant="dark"
                value={iosDraftDate}
              />

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

const styles = StyleSheet.create({
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
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
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  fieldError: {
    borderColor: theme.colors.danger,
  },
  fieldPressed: {
    transform: [{ scale: 0.995 }],
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalAction: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    width: '100%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 13, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  value: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 16,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  wrapper: {
    gap: theme.spacing.sm,
  },
});
