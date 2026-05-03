import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppTextField } from '@/src/components/ui/app-text-field';
import {
  trainingFeedbackFormSchema,
  type TrainingFeedbackFormValues,
} from '@/src/features/trainings/schemas/training-feedback-form-schema';
import { rtlRow } from '@/src/lib/rtl';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type TrainingFeedbackFormProps = {
  initialValues?: Partial<TrainingFeedbackFormValues>;
  isSubmitting?: boolean;
  isUpdating?: boolean;
  onCancel?: () => void;
  onSubmit: (values: TrainingFeedbackFormValues) => Promise<void> | void;
};

const defaultValues: TrainingFeedbackFormValues = {
  comment: '',
  rating: 5,
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

export function TrainingFeedbackForm({
  initialValues,
  isSubmitting = false,
  isUpdating = false,
  onCancel,
  onSubmit,
}: TrainingFeedbackFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
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

  return (
    <AppCard
      description={
        isUpdating
          ? 'עדכון משוב על האימון. המשוב משותף לכלל היישובים שהשתתפו.'
          : 'הוספת משוב על האימון. המשוב יישמר פעם אחת לכלל היישובים שהשתתפו.'
      }
      title={isUpdating ? 'עריכת משוב' : 'הוספת משוב'}
      variant="accent"
    >
      <View style={styles.form}>
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

const styles = createThemedStyles((theme: AppTheme) => ({
  actionButton: {
    flex: 1,
  },
  actions: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: 8,
  },
  chips: {
    ...rtlRow,
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
  label: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
}));
