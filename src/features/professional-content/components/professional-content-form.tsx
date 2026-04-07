import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppSwitchField } from '@/src/components/ui/app-switch-field';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { SectionBlock } from '@/src/components/ui/section-block';
import {
  getProfessionalContentTypeLabel,
  professionalContentTypes,
} from '@/src/features/professional-content/constants';
import {
  professionalContentFormSchema,
  type ProfessionalContentFormValues,
} from '@/src/features/professional-content/schemas/professional-content-form-schema';
import { createThemedStyles, type AppTheme } from '@/src/theme';

type ProfessionalContentFormProps = {
  initialValues?: Partial<ProfessionalContentFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: ProfessionalContentFormValues) => Promise<void> | void;
  submitLabel: string;
};

const defaultValues: ProfessionalContentFormValues = {
  content_type: 'video',
  description: '',
  is_active: true,
  thumbnail_url: '',
  title: '',
  topic: '',
  url: '',
};

export function ProfessionalContentForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: ProfessionalContentFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<ProfessionalContentFormValues>({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
    resolver: zodResolver(professionalContentFormSchema),
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
            label="כותרת"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="לדוגמה: סרטון בטיחות מטווח"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="content_type"
        render={({ field: { onChange, value } }) => (
          <SectionBlock
            description="סוג התוכן קובע את הסיווג הראשי בספרייה."
            title="סוג תוכן"
          >
            <View style={styles.chips}>
              {professionalContentTypes.map((contentType) => (
                <AppChip
                  key={contentType}
                  label={getProfessionalContentTypeLabel(contentType)}
                  onPress={() => {
                    onChange(contentType);
                  }}
                  selected={value === contentType}
                  tone={value === contentType ? 'accent' : 'neutral'}
                />
              ))}
            </View>
          </SectionBlock>
        )}
      />

      <Controller
        control={control}
        name="topic"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.topic?.message}
            hint="אופציונלי"
            label="נושא"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="לדוגמה: בטיחות, מטווח, נהלים"
            value={value ?? ''}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            errorMessage={errors.description?.message}
            hint="תיאור קצר שיוצג בכרטיס הספרייה"
            label="תיאור"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="סיכום קצר של התוכן והערך המבצעי שלו"
            value={value ?? ''}
          />
        )}
      />

      <Controller
        control={control}
        name="url"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            autoCapitalize="none"
            errorMessage={errors.url?.message}
            keyboardType="url"
            label="קישור"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="https://..."
            textAlign="left"
            value={value}
            writingDirection="ltr"
          />
        )}
      />

      <Controller
        control={control}
        name="thumbnail_url"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppTextField
            autoCapitalize="none"
            errorMessage={errors.thumbnail_url?.message}
            hint="אופציונלי"
            keyboardType="url"
            label="קישור תמונה"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="https://..."
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
            description="תוכן לא פעיל יישאר לניהול אך לא יוצג לכלל המשתמשים."
            label="תוכן פעיל"
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

const styles = createThemedStyles((theme: AppTheme) => ({
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.md,
  },
}));
