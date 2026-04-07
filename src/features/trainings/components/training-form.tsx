import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppDateField } from '@/src/components/ui/app-date-field';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { SectionBlock } from '@/src/components/ui/section-block';
import { trainingStatuses, trainingTypes } from '@/src/features/trainings/constants';
import {
  isSameSettlementAttendance,
  syncSettlementAttendance,
} from '@/src/features/trainings/lib/training-attendance-utils';
import {
  trainingFormSchema,
  type TrainingFormValues,
} from '@/src/features/trainings/schemas/training-form-schema';
import type { Settlement, UserProfile } from '@/src/types/database';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type TrainingFormProps = {
  allowEmptyInstructor?: boolean;
  initialValues?: Partial<TrainingFormValues>;
  instructorOptions: Pick<UserProfile, 'full_name' | 'id'>[];
  isSubmitting?: boolean;
  onSubmit: (values: TrainingFormValues) => Promise<void> | void;
  settlementOptions: Pick<Settlement, 'area' | 'id' | 'name' | 'total_squad_members'>[];
  submitLabel: string;
};

const defaultValues: TrainingFormValues = {
  instructor_id: '',
  location: '',
  notes: '',
  settlement_attendance: [],
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

function formatTotalSquadMembers(value: number | null) {
  return value === null ? 'לא הוגדרה מצבה' : String(value);
}

export function TrainingForm({
  allowEmptyInstructor = true,
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
    setValue,
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

  const selectedSettlementIds = useWatch({
    control,
    name: 'settlement_ids',
  });
  const settlementAttendance = useWatch({
    control,
    name: 'settlement_attendance',
  });
  const selectedSettlements = useMemo(() => {
    const settlementById = new Map(settlementOptions.map((settlement) => [settlement.id, settlement]));

    return (selectedSettlementIds ?? []).reduce<typeof settlementOptions>((items, settlementId) => {
      const settlement = settlementById.get(settlementId);

      if (settlement) {
        items.push(settlement);
      }

      return items;
    }, []);
  }, [selectedSettlementIds, settlementOptions]);

  useEffect(() => {
    const nextAttendance = syncSettlementAttendance(
      selectedSettlements,
      settlementAttendance ?? []
    );

    if (!isSameSettlementAttendance(settlementAttendance ?? [], nextAttendance)) {
      setValue('settlement_attendance', nextAttendance, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [selectedSettlements, settlementAttendance, setValue]);

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

      {selectedSettlements.length ? (
        <SectionBlock
          description="דווחו כמה מחברי כיתת הכוננות של כל יישוב השתתפו בפועל. הנתונים יישמרו כ־snapshot בתוך האימון."
          title="השתתפות לפי יישוב"
        >
          <View style={styles.attendanceList}>
            {selectedSettlements.map((settlement, index) => {
              const attendanceItem = settlementAttendance?.[index];
              const trainedCount =
                attendanceItem?.settlement_id === settlement.id
                  ? attendanceItem.trained_count
                  : 0;
              const attendanceError =
                attendanceItem?.settlement_id === settlement.id
                  ? errors.settlement_attendance?.[index]?.trained_count?.message
                  : undefined;

              return (
                <AppCard key={settlement.id} style={styles.attendanceCard}>
                  <View style={styles.attendanceCardHeader}>
                    <Text style={styles.attendanceSettlementName}>{settlement.name}</Text>
                    <Text style={styles.attendanceSettlementMeta}>
                      מצבה מלאה: {formatTotalSquadMembers(attendanceItem?.total_squad_members_snapshot ?? settlement.total_squad_members)}
                    </Text>
                  </View>

                  {attendanceItem?.total_squad_members_snapshot === null ? (
                    <View style={styles.attendanceWarningBox}>
                      <Text style={styles.attendanceWarningText}>
                        לא הוגדרה מצבת כיתת כוננות ליישוב זה
                      </Text>
                    </View>
                  ) : null}

                  <Controller
                    control={control}
                    name={`settlement_attendance.${index}.trained_count`}
                    render={({ field: { onBlur, onChange, value } }) => (
                      <AppTextField
                        errorMessage={attendanceError}
                        hint="כמה מחברי הכיתה השתתפו באימון בפועל"
                        inputMode="numeric"
                        keyboardType="number-pad"
                        label="כמה התאמנו בפועל"
                        onBlur={onBlur}
                        onChangeText={(text) => {
                          const sanitized = text.replace(/[^\d]/g, '');
                          onChange(sanitized ? Number(sanitized) : 0);
                        }}
                        placeholder="0"
                        textAlign="left"
                        value={String(value ?? trainedCount ?? 0)}
                        writingDirection="ltr"
                      />
                    )}
                  />
                </AppCard>
              );
            })}
          </View>
          <FieldError message={errors.settlement_attendance?.message} />
        </SectionBlock>
      ) : null}

      <Controller
        control={control}
        name="instructor_id"
        render={({ field: { onChange, value } }) => (
          <SectionBlock description="ניתן להשאיר ללא מדריך משויך." title="מדריך">
            <View style={styles.chips}>
              {allowEmptyInstructor ? (
                <AppChip
                  label="ללא מדריך"
                  onPress={() => {
                    onChange('');
                  }}
                  selected={!value}
                  tone={!value ? 'accent' : 'neutral'}
                />
              ) : null}
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
            render={({ field: { onChange, value } }) => (
              <AppDateField
                errorMessage={errors.training_date?.message}
                hint="התאריך יישמר אוטומטית בפורמט המערכת."
                label="תאריך"
                onChange={onChange}
                placeholder="בחרו תאריך"
                value={value}
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

const styles = createThemedStyles((theme: AppTheme) => ({
  attendanceCard: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  attendanceCardHeader: {
    gap: 4,
  },
  attendanceList: {
    gap: theme.spacing.sm,
  },
  attendanceSettlementMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  attendanceSettlementName: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  attendanceWarningBox: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  attendanceWarningText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    textAlign: 'right',
  },
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
}));
