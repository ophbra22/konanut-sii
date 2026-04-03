import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { SectionBlock } from '@/src/components/ui/section-block';
import { trainingStatuses, trainingTypes } from '@/src/features/trainings/constants';
import {
  trainingFormSchema,
  type TrainingFormValues,
} from '@/src/features/trainings/schemas/training-form-schema';
import type { Settlement, UserProfile } from '@/src/types/database';
import { theme } from '@/src/theme';

type TrainingFormProps = {
  initialValues?: Partial<TrainingFormValues>;
  instructorOptions: Pick<UserProfile, 'full_name' | 'id'>[];
  isSubmitting?: boolean;
  onSubmit: (values: TrainingFormValues) => Promise<void> | void;
  settlementOptions: Pick<Settlement, 'area' | 'id' | 'name'>[];
  submitLabel: string;
};

const defaultValues: TrainingFormValues = {
  instructor_id: '',
  location: '',
  notes: '',
  settlement_ids: [],
  status: 'מתוכנן',
  title: '',
  training_date: '',
  training_time: '',
  training_type: 'מטווח',
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

export function TrainingForm({
  initialValues,
  instructorOptions,
  isSubmitting = false,
  onSubmit,
  settlementOptions,
  submitLabel,
}: TrainingFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<TrainingFormValues>({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
    resolver: zodResolver(trainingFormSchema),
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
        name="title"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.title?.message}
            label="כותרת אימון"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="לדוגמה: מטווח חציוני צפון"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="training_type"
        render={({ field: { onChange, value } }) => (
          <SectionBlock
            description="הטיפוס משפיע גם על חישוב דירוג היישובים בחציון."
            title="סוג אימון"
          >
            <View style={styles.chips}>
              {trainingTypes.map((option) => (
                <AppChip
                  key={option}
                  label={option}
                  onPress={() => {
                    onChange(option);
                  }}
                  selected={value === option}
                  tone={value === option ? 'accent' : 'neutral'}
                />
              ))}
            </View>
            <FieldError message={errors.training_type?.message} />
          </SectionBlock>
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.location?.message}
            hint="אופציונלי"
            label="מיקום"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="מטווח אלונים / יישוב / מתקן אימונים"
            value={value ?? ''}
          />
        )}
      />

      <Controller
        control={control}
        name="settlement_ids"
        render={({ field: { onChange, value } }) => (
          <SectionBlock
            description="יש לבחור את היישובים המשתתפים באימון."
            title="יישובים משתתפים"
          >
            <View style={styles.chips}>
              {settlementOptions.map((settlement) => {
                const isSelected = value.includes(settlement.id);

                return (
                  <AppChip
                    key={settlement.id}
                    label={`${settlement.name} • ${settlement.area}`}
                    onPress={() => {
                      onChange(
                        isSelected
                          ? value.filter((item) => item !== settlement.id)
                          : [...value, settlement.id]
                      );
                    }}
                    selected={isSelected}
                    tone={isSelected ? 'accent' : 'neutral'}
                  />
                );
              })}
            </View>
            <FieldError message={errors.settlement_ids?.message} />
          </SectionBlock>
        )}
      />

      <Controller
        control={control}
        name="instructor_id"
        render={({ field: { onChange, value } }) => (
          <SectionBlock description="ניתן להשאיר ללא מדריך משויך." title="מדריך">
            <View style={styles.chips}>
              <AppChip
                label="ללא מדריך"
                onPress={() => {
                  onChange('');
                }}
                selected={!value}
                tone={!value ? 'accent' : 'neutral'}
              />
              {instructorOptions.map((instructor) => (
                <AppChip
                  key={instructor.id}
                  label={instructor.full_name}
                  onPress={() => {
                    onChange(instructor.id);
                  }}
                  selected={value === instructor.id}
                  tone={value === instructor.id ? 'accent' : 'neutral'}
                />
              ))}
            </View>
            <FieldError message={errors.instructor_id?.message} />
          </SectionBlock>
        )}
      />

      <View style={styles.inlineFields}>
        <View style={styles.inlineField}>
          <Controller
            control={control}
            name="training_date"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppTextField
                errorMessage={errors.training_date?.message}
                label="תאריך"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="2026-04-03"
                textAlign="left"
                value={value}
                writingDirection="ltr"
              />
            )}
          />
        </View>

        <View style={styles.inlineField}>
          <Controller
            control={control}
            name="training_time"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppTextField
                errorMessage={errors.training_time?.message}
                hint="אופציונלי"
                label="שעה"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="19:30"
                textAlign="left"
                value={value ?? ''}
                writingDirection="ltr"
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <SectionBlock title="סטטוס אימון">
            <View style={styles.chips}>
              {trainingStatuses.map((option) => (
                <AppChip
                  key={option}
                  label={option}
                  onPress={() => {
                    onChange(option);
                  }}
                  selected={value === option}
                  tone={value === option ? 'accent' : 'neutral'}
                />
              ))}
            </View>
            <FieldError message={errors.status?.message} />
          </SectionBlock>
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.notes?.message}
            hint="אופציונלי"
            label="הערות"
            multiline
            numberOfLines={4}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="פרטי הערכות, דגשים, ציוד או הערות תיאום"
            value={value ?? ''}
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
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  form: {
    gap: theme.spacing.md,
  },
  inlineField: {
    flex: 1,
    minWidth: 130,
  },
  inlineFields: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
});
