import type { TrainingDetails } from '@/src/features/trainings/api/trainings-service';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function withFallback(value: string | null | undefined) {
  return normalizeText(value) ?? 'לא הוזן';
}

function formatHebrewList(values: string[]) {
  const cleanedValues = values
    .map((value) => value.trim())
    .filter(Boolean);

  if (!cleanedValues.length) {
    return 'לא הוזן';
  }

  if (cleanedValues.length === 1) {
    return cleanedValues[0];
  }

  if (cleanedValues.length === 2) {
    return `${cleanedValues[0]} ו${cleanedValues[1]}`;
  }

  return `${cleanedValues.slice(0, -1).join(', ')} ו${cleanedValues.at(-1)}`;
}

function getPlagaName(training: TrainingDetails) {
  const plagaNames = Array.from(
    new Set(
      training.settlements
        .map((settlement) => normalizeText(settlement.area))
        .filter((value): value is string => Boolean(value))
    )
  );

  return formatHebrewList(plagaNames);
}

function getSettlementNames(training: TrainingDetails) {
  return formatHebrewList(training.settlements.map((settlement) => settlement.name));
}

function getTimeRange(training: TrainingDetails) {
  if (!training.training_time) {
    return 'לא הוזן';
  }

  return `${formatDisplayTime(training.training_time)} - לא הוזן`;
}

function formatAttendanceLine(training: TrainingDetails) {
  if (!training.settlement_attendance.length) {
    return 'לא הוזן';
  }

  return training.settlement_attendance
    .map((item) => {
      const totalLabel =
        item.total_squad_members_snapshot === null
          ? 'לא הוגדר'
          : String(item.total_squad_members_snapshot);
      const participationLabel =
        item.participation_rate === null ? '' : ` (${item.participation_rate}% השתתפות)`;

      return `${item.settlement_name}: ${item.trained_count} מתוך ${totalLabel}${participationLabel}`;
    })
    .join('\n');
}

function getParticipantsSummary(training: TrainingDetails) {
  const { overall_participation_rate, total_squad_overall, total_trained_overall } =
    training.participationSummary;

  if (!training.settlement_attendance.length) {
    return 'לא הוזן';
  }

  if (total_squad_overall > 0) {
    const participationText =
      overall_participation_rate === null ? '' : ` • ${overall_participation_rate}% השתתפות`;

    return `${total_trained_overall} מתוך ${total_squad_overall}${participationText}`;
  }

  return `${total_trained_overall}`;
}

function getClosingSummary(training: TrainingDetails) {
  const { overall_participation_rate, total_squad_overall, total_trained_overall } =
    training.participationSummary;
  const feedbackSuffix =
    training.averageFeedbackRating !== null
      ? ` ממוצע המשובים: ${training.averageFeedbackRating.toFixed(1)}.`
      : '';

  if (training.settlement_attendance.length && overall_participation_rate !== null) {
    return `סה"כ השתתפו ${total_trained_overall} מתוך ${total_squad_overall}. אחוז השתתפות כולל: ${overall_participation_rate}%.${feedbackSuffix}`;
  }

  if (training.settlement_attendance.length) {
    return `סה"כ השתתפו ${total_trained_overall}. אין מספיק נתונים לחישוב אחוז השתתפות כולל.${feedbackSuffix}`;
  }

  if (training.averageFeedbackRating !== null) {
    return `האימון הושלם. ממוצע המשובים: ${training.averageFeedbackRating.toFixed(1)}.`;
  }

  return 'האימון הושלם בהצלחה.';
}

export function buildTrainingCompletionSummary(training: TrainingDetails) {
  const plagaName = getPlagaName(training);
  const settlementNames = getSettlementNames(training);
  const instructorName = withFallback(training.instructor?.full_name);
  const notes = withFallback(training.notes);

  return [
    `*🚨זרוע יישובים / ${plagaName} / ${settlementNames}*`,
    '',
    `בוצע אימון ${training.title}.`,
    '',
    `*תאריך:* ${formatDisplayDate(training.training_date)}`,
    `*מיקום:* ${withFallback(training.location)}`,
    `*מדריכים:* ${instructorName}`,
    '*ק בטיחות:* לא הוזן',
    '*חונכים/משקבטים:* לא הוזן',
    `*סה"כ כמות משתתפים:* ${getParticipantsSummary(training)}`,
    `*שעות:* ${getTimeRange(training)}`,
    `*נושאי המטווח:* ${notes}`,
    '',
    '*במטווח:*',
    formatAttendanceLine(training),
    '',
    getClosingSummary(training),
  ].join('\n');
}
