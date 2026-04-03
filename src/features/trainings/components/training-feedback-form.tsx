import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useWatch, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppTextField } from '@/src/components/ui/app-text-field';
import type { TrainingFeedbackItem } from '@/src/features/trainings/api/trainings-service';
import {
  trainingFeedbackFormSchema,
  type TrainingFeedbackFormValues,
} from '@/src/features/trainings/schemas/training-feedback-form-schema';
import type { Settlement } from '@/src/types/database';
import { theme } from '@/src/theme';

type SettlementOption = Pick<Settlement, 'area' | 'id' | 'name'>;

type TrainingFeedbackFormProps = {
  existingFeedbacks: TrainingFeedbackItem[];
  initialValues?: Partial<TrainingFeedbackFormValues>;
  isSubmitting?: boolean;
  isUpdating?: boolean;
  lockSettlement?: boolean;
  onCancel?: () => void;
  onSubmit: (values: TrainingFeedbackFormValues) => Promise<void> | void;
  settlementOptions: SettlementOption[];
};

const defaultValues: TrainingFeedbackFormValues = {
  comment: '',
  rating: 5,
  settlement_id: '',
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

export function TrainingFeedbackForm({
  existingFeedbacks,
  initialValues,
  isSubmitting = false,
  isUpdating = false,
  lockSettlement = false,
  onCancel,
  onSubmit,
  settlementOptions,
}: TrainingFeedbackFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<TrainingFeedbackFormValues>({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
    resolver: zodResolver(trainingFeedbackFormSchema),
  });

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  const selectedSettlementId = useWatch({
    control,
    name: 'settlement_id',
  });

  const existingFeedbackForSettlement = existingFeedbacks.find(
    (feedback) => feedback.settlement?.id === selectedSettlementId
  );

  return (
    <AppCard
      description={
        isUpdating
          ? 'עדכון משוב קיים ליישוב באימון.'
          : 'הוספת משוב עבור יישוב שמשויך לאימון הנוכחי.'
      }
      title={isUpdating ? 'עריכת משוב' : 'הוספת משוב'}
      variant="accent"
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>יישוב</Text>
          <View style={styles.chips}>
            {settlementOptions.map((settlement) => {
              const isSelected = selectedSettlementId === settlement.id;
              const isDisabled = lockSettlement && !isSelected;

              return (
                <AppChip
                  key={settlement.id}
                  disabled={isDisabled}
                  label={`${settlement.name} • ${settlement.area}`}
                  onPress={() => {
                    if (!lockSettlement) {
                      setValue('settlement_id', settlement.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  selected={isSelected}
                  tone={isSelected ? 'accent' : 'neutral'}
                />
              );
            })}
          </View>
          <FieldError message={errors.settlement_id?.message} />
          {!isUpdating && existingFeedbackForSettlement ? (
            <Text style={styles.hint}>
              כבר קיים משוב עבור היישוב הזה. השמירה תעדכן את המשוב הקיים במקום ליצור כפילות.
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="rating"
          render={({ field: { onChange, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>דירוג</Text>
              <View style={styles.chips}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <AppChip
                    key={rating}
                    label={`${rating}/5`}
                    onPress={() => {
                      onChange(rating);
                    }}
                    selected={value === rating}
                    tone={value === rating ? 'accent' : 'neutral'}
                  />
                ))}
              </View>
              <FieldError message={errors.rating?.message} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="comment"
          render={({ field: { onBlur, onChange, value } }) => (
            <AppTextField
              errorMessage={errors.comment?.message}
              hint="אופציונלי"
              label="הערת מדריך"
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="סיכום קצר, הערות ביצוע, נקודות לשיפור או התרשמות מקצועית."
              style={styles.commentInput}
              textAlignVertical="top"
              value={value}
            />
          )}
        />

        <View style={styles.actions}>
          {onCancel ? (
            <AppButton
              fullWidth={false}
              label="ביטול"
              onPress={onCancel}
              style={styles.actionButton}
              variant="ghost"
            />
          ) : null}
          <AppButton
            fullWidth={false}
            label={isUpdating ? 'שמירת עדכון' : 'שמירת משוב'}
            loading={isSubmitting}
            onPress={() => {
              void handleSubmit(onSubmit)();
            }}
            style={styles.actionButton}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  commentInput: {
    minHeight: 108,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  field: {
    gap: 8,
  },
  form: {
    gap: 12,
  },
  hint: {
    color: theme.colors.warning,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
});
