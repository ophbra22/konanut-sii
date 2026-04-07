import type { ProfessionalContentType } from '@/src/types/database';

export const professionalContentTypes = [
  'video',
  'presentation',
  'document',
] as const satisfies readonly ProfessionalContentType[];

export type ProfessionalContentFilter = 'all' | ProfessionalContentType;

export const professionalContentFilterOptions: Array<{
  key: ProfessionalContentFilter;
  label: string;
}> = [
  { key: 'all', label: 'הכל' },
  { key: 'video', label: 'וידאו' },
  { key: 'presentation', label: 'מצגות' },
  { key: 'document', label: 'מסמכים' },
];

export function getProfessionalContentTypeLabel(type: ProfessionalContentType) {
  switch (type) {
    case 'video':
      return 'וידאו';
    case 'presentation':
      return 'מצגת';
    default:
      return 'מסמך';
  }
}
