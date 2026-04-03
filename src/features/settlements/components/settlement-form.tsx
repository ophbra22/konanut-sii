import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { AppSwitchField } from '@/src/components/ui/app-switch-field';
import { AppTextField } from '@/src/components/ui/app-text-field';
import {
  settlementFormSchema,
  type SettlementFormValues,
} from '@/src/features/settlements/schemas/settlement-form-schema';
import { theme } from '@/src/theme';

type SettlementFormProps = {
  initialValues?: Partial<SettlementFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: SettlementFormValues) => Promise<void> | void;
  submitLabel: string;
};

const defaultValues: SettlementFormValues = {
  area: '',
  coordinator_name: '',
  coordinator_phone: '',
  is_active: true,
  name: '',
  regional_council: '',
};

export function SettlementForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: SettlementFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<SettlementFormValues>({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
    resolver: zodResolver(settlementFormSchema),
  });

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.name?.message}
            label="שם היישוב"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="לדוגמה: כפר תבור"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="regional_council"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.regional_council?.message}
            hint="אופציונלי"
            label="מועצה אזורית"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="הזינו מועצה אזורית"
            value={value ?? ''}
          />
        )}
      />

      <Controller
        control={control}
        name="area"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.area?.message}
            label="אזור"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="צפון / מרכז / דרום"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="coordinator_name"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.coordinator_name?.message}
            hint="אופציונלי"
            label="שם רכז יישובי"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="הזינו שם רכז"
            value={value ?? ''}
          />
        )}
      />

      <Controller
        control={control}
        name="coordinator_phone"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.coordinator_phone?.message}
            hint="אופציונלי"
            keyboardType="phone-pad"
            label="טלפון רכז"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="050-0000000"
            textAlign="left"
            value={value ?? ''}
            writingDirection="ltr"
          />
        )}
      />

      <Controller
        control={control}
        name="is_active"
        render={({ field: { onChange, value } }) => (
          <AppSwitchField
            description="יישוב לא פעיל יישאר במערכת אך לא יופיע כחלק מכשירות שוטפת."
            label="יישוב פעיל"
            onValueChange={onChange}
            value={value}
          />
        )}
      />

      <AppButton
        disabled={isSubmitting}
        label={submitLabel}
        loading={isSubmitting}
        onPress={() => {
          void handleSubmit(onSubmit)();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.md,
  },
});
