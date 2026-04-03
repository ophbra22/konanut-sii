import type { TrainingStatus, TrainingType } from '@/src/types/database';

export const trainingTypes: TrainingType[] = [
  'מטווח',
  'הגנת יישוב',
  'אימון יבש',
  'ריענון',
  'תרגיל',
  'אימון לילה',
  'חירום',
];

export const trainingStatuses: TrainingStatus[] = [
  'מתוכנן',
  'הושלם',
  'בוטל',
  'נדחה',
];
