import type { TrainingFormValues } from '@/src/features/trainings/schemas/training-form-schema';
import {
  calculateParticipationRate,
  normalizeTrainingSettlementAttendance,
  syncSettlementAttendance,
} from '@/src/features/trainings/lib/training-attendance-utils';
import type {
  Json,
  Settlement,
  Training,
  TrainingSettlementAttendance,
  TablesInsert,
  TablesUpdate,
} from '@/src/types/database';

function toOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getTrainingFormValues(
  training?: Partial<Training> & {
    settlement_attendance?: Json | TrainingSettlementAttendance[] | null;
    settlements?: Array<Pick<Settlement, 'id' | 'name' | 'total_squad_members'>>;
  }
): TrainingFormValues {
  const normalizedAttendance = normalizeTrainingSettlementAttendance(
    (training?.settlement_attendance as Json | null | undefined) ?? null
  );
  const settlementAttendance = training?.settlements?.length
    ? syncSettlementAttendance(training.settlements, normalizedAttendance)
    : normalizedAttendance;

  return {
    instructor_id: training?.instructor_id ?? '',
    location: training?.location ?? '',
    notes: training?.notes ?? '',
    settlement_attendance: settlementAttendance,
    settlement_ids: training?.settlements?.map((item) => item.id) ?? [],
    status: training?.status ?? 'מתוכנן',
    title: training?.title ?? '',
    training_date: training?.training_date ?? '',
    training_time: training?.training_time ? training.training_time.slice(0, 5) : '',
    training_type: training?.training_type ?? 'מטווח',
  };
}

function toTrainingSettlementAttendanceInput(values: TrainingFormValues) {
  const attendanceBySettlementId = new Map(
    values.settlement_attendance.map((item) => [item.settlement_id, item])
  );

  return values.settlement_ids.reduce<TrainingSettlementAttendance[]>(
    (items, settlementId) => {
      const item = attendanceBySettlementId.get(settlementId);

      if (!item) {
        return items;
      }

      items.push({
        participation_rate: calculateParticipationRate(
          item.trained_count,
          item.total_squad_members_snapshot
        ),
        settlement_id: item.settlement_id,
        settlement_name: item.settlement_name.trim(),
        total_squad_members_snapshot: item.total_squad_members_snapshot,
        trained_count: item.trained_count,
      });

      return items;
    },
    []
  );
}

export function toTrainingInsertInput(
  values: TrainingFormValues
): TablesInsert<'trainings'> {
  return {
    instructor_id: toOptionalText(values.instructor_id),
    location: toOptionalText(values.location),
    notes: toOptionalText(values.notes),
    settlement_attendance: toTrainingSettlementAttendanceInput(values),
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
