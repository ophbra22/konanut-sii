import type { SettlementListItem } from '@/src/features/settlements/api/settlements-service';

export const DEFAULT_COMPLIANCE_FILTER = 'all';
export const SETTLEMENTS_COMPLIANCE_FILTER_PARAM = 'complianceFilter';
export const SETTLEMENTS_COMPLIANCE_FILTER_REQUEST_PARAM = 'filterRequestAt';

export type ComplianceFilterKey =
  | 'all'
  | 'defense-completed'
  | 'defense-missing'
  | 'shooting-completed'
  | 'shooting-missing';

export type ComplianceFilterOption = {
  key: ComplianceFilterKey;
  label: string;
  tone: 'accent' | 'neutral' | 'warning';
};

type SettlementComplianceSnapshot = Pick<
  SettlementListItem,
  'defenseCompletedCurrentYear' | 'shootingCompletedCurrentHalfYear'
>;

export const COMPLIANCE_FILTERS: ComplianceFilterOption[] = [
  {
    key: 'all',
    label: 'כל היישובים',
    tone: 'neutral',
  },
  {
    key: 'shooting-completed',
    label: 'מטווח בוצע',
    tone: 'accent',
  },
  {
    key: 'shooting-missing',
    label: 'מטווח חסר',
    tone: 'warning',
  },
  {
    key: 'defense-completed',
    label: 'הגנת יישוב בוצעה',
    tone: 'accent',
  },
  {
    key: 'defense-missing',
    label: 'הגנת יישוב חסרה',
    tone: 'warning',
  },
];

export function isComplianceFilterKey(value: unknown): value is ComplianceFilterKey {
  return (
    value === 'all' ||
    value === 'defense-completed' ||
    value === 'defense-missing' ||
    value === 'shooting-completed' ||
    value === 'shooting-missing'
  );
}

export function getComplianceFilterFromParam(value: unknown): ComplianceFilterKey {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return isComplianceFilterKey(normalizedValue)
    ? normalizedValue
    : DEFAULT_COMPLIANCE_FILTER;
}

export function matchesComplianceFilter(
  settlement: SettlementComplianceSnapshot,
  filter: ComplianceFilterKey
) {
  switch (filter) {
    case 'shooting-completed':
      return settlement.shootingCompletedCurrentHalfYear;
    case 'shooting-missing':
      return !settlement.shootingCompletedCurrentHalfYear;
    case 'defense-completed':
      return settlement.defenseCompletedCurrentYear;
    case 'defense-missing':
      return !settlement.defenseCompletedCurrentYear;
    default:
      return true;
  }
}

export function getEmptyFilterDescription(filter: ComplianceFilterKey) {
  switch (filter) {
    case 'shooting-completed':
      return 'לא נמצאו יישובים עם מטווח שבוצע בחציון הנוכחי.';
    case 'shooting-missing':
      return 'לא נמצאו יישובים שחסר להם מטווח בחציון הנוכחי.';
    case 'defense-completed':
      return 'לא נמצאו יישובים עם הגנת יישוב שבוצעה השנה.';
    case 'defense-missing':
      return 'לא נמצאו יישובים שחסרה להם הגנת יישוב השנה.';
    default:
      return 'לא נמצאו יישובים להצגה.';
  }
}
