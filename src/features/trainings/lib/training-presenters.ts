import type { TrainingStatus } from '@/src/types/database';

export function getTrainingStatusTone(status: TrainingStatus) {
  switch (status) {
    case 'בוטל':
      return 'danger';
    case 'נדחה':
      return 'warning';
    case 'הושלם':
      return 'accent';
    default:
      return 'neutral';
  }
}
