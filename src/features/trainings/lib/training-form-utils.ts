import type { TrainingFormValues } from '@/src/features/trainings/schemas/training-form-schema';
import type { Training, TablesInsert, TablesUpdate } from '@/src/types/database';

function toOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getTrainingFormValues(
  training?: Partial<Training> & {
    settlements?: Array<{ id: string }>;
  }
): TrainingFormValues {
  return {
    instructor_id: training?.instructor_id ?? '',
    location: training?.location ?? '',
    notes: training?.notes ?? '',
    settlement_ids: training?.settlements?.map((item) => item.id) ?? [],
    status: training?.status ?? 'מתוכנן',
    title: training?.title ?? '',
    training_date: training?.training_date ?? '',
    training_time: training?.training_time ? training.training_time.slice(0, 5) : '',
    training_type: training?.training_type ?? 'מטווח',
  };
}

export function toTrainingInsertInput(
  values: TrainingFormValues
): TablesInsert<'trainings'> {
  return {
    instructor_id: toOptionalText(values.instructor_id),
    location: toOptionalText(values.location),
    notes: toOptionalText(values.notes),
    status: values.status,
    title: values.title.trim(),
    training_date: values.training_date,
    training_time: toOptionalText(values.training_time),
    training_type: values.training_type,
  };
}

export function toTrainingUpdateInput(
  values: TrainingFormValues
): TablesUpdate<'trainings'> {
  return toTrainingInsertInput(values);
}
