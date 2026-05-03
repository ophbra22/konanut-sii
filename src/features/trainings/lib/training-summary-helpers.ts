import type { TrainingDetails } from '@/src/features/trainings/api/trainings-service';
import type { TrainingStatus } from '@/src/types/database';

export const summaryColors = {
  background: '#F4F7FA',
  border: '#D6E0EA',
  card: '#FFFFFF',
  green: '#6A8F3A',
  orange: '#D9901A',
  primary: '#4169E1',
  red: '#DD5A48',
  strongGreen: '#3E7D32',
  text: '#17212B',
  textSecondary: '#6B7A88',
};

export function getScoreColor(score: number) {
  if (score >= 85) {
    return summaryColors.strongGreen;
  }

  if (score >= 70) {
    return summaryColors.green;
  }

  if (score >= 60) {
    return summaryColors.orange;
  }

  return summaryColors.red;
}

export function getReadinessLabel(score: number) {
  if (score >= 85) {
    return 'כשירות גבוהה';
  }

  if (score >= 70) {
    return 'כשירות טובה';
  }

  if (score >= 60) {
    return 'כשירות בינונית';
  }

  return 'כשירות נמוכה';
}

export function getTrainingStatus(training: Pick<TrainingDetails, 'feedbacks' | 'settlement_attendance' | 'status'>) {
  if (training.status === 'הושלם') {
    if (!training.settlement_attendance.length || !training.feedbacks.length) {
      return 'חסר נתונים';
    }

    return 'הושלם';
  }

  return training.status === 'מתוכנן' ? 'מתוכנן' : training.status;
}

export function getTrainingStatusColor(status: TrainingStatus | 'חסר נתונים') {
  if (status === 'הושלם') {
    return summaryColors.green;
  }

  if (status === 'חסר נתונים' || status === 'נדחה') {
    return summaryColors.orange;
  }

  if (status === 'בוטל') {
    return summaryColors.red;
  }

  return summaryColors.primary;
}

export function getAttendanceStatus(training: Pick<TrainingDetails, 'participationSummary' | 'settlement_attendance'>) {
  const rate = training.participationSummary.overall_participation_rate;

  if (!training.settlement_attendance.length) {
    return 'חסר נתונים';
  }

  if (rate === null) {
    return 'אין מצבה';
  }

  return rate >= 70 ? 'עומד ביעד' : 'מתחת ליעד';
}

export function getTrainingOperationalScore(averageFeedbackRating: number | null) {
  if (!averageFeedbackRating) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(averageFeedbackRating * 20)));
}
