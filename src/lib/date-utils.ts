import dayjs, { type Dayjs } from 'dayjs';

export type HalfYearPeriod = `${number}-H1` | `${number}-H2`;

export function isHalfYearPeriod(value: string): value is HalfYearPeriod {
  return /^\d{4}-H[12]$/.test(value);
}

export function getHalfYearPeriod(dateInput: string | Date | Dayjs = dayjs()) {
  const date = dayjs(dateInput);
  const half = date.month() < 6 ? 'H1' : 'H2';

  return `${date.year()}-${half}` as HalfYearPeriod;
}

export function getPreviousHalfYearPeriod(period: HalfYearPeriod) {
  const [yearValue, half] = period.split('-') as [string, 'H1' | 'H2'];
  const year = Number(yearValue);

  if (half === 'H1') {
    return `${year - 1}-H2` as HalfYearPeriod;
  }

  return `${year}-H1` as HalfYearPeriod;
}

export function getPeriodDateRange(period: HalfYearPeriod) {
  const [yearValue, half] = period.split('-') as [string, 'H1' | 'H2'];
  const year = Number(yearValue);

  const start = half === 'H1' ? dayjs(`${year}-01-01`) : dayjs(`${year}-07-01`);
  const end = half === 'H1' ? dayjs(`${year}-06-30`) : dayjs(`${year}-12-31`);

  return {
    end: end.endOf('day'),
    start: start.startOf('day'),
  };
}

export function getCurrentAndPreviousHalfYearPeriods(referenceDate = dayjs()) {
  const current = getHalfYearPeriod(referenceDate);

  return [current, getPreviousHalfYearPeriod(current)] as const;
}

export function getRecentHalfYearPeriods(
  count = 6,
  referenceDate: string | Date | Dayjs = dayjs()
) {
  const periods: HalfYearPeriod[] = [];
  let current = getHalfYearPeriod(referenceDate);

  for (let index = 0; index < count; index += 1) {
    periods.push(current);
    current = getPreviousHalfYearPeriod(current);
  }

  return periods;
}

export function sortHalfYearPeriodsDesc(periods: HalfYearPeriod[]) {
  return [...periods].sort((left, right) => {
    const [leftYear, leftHalf] = left.split('-') as [string, 'H1' | 'H2'];
    const [rightYear, rightHalf] = right.split('-') as [string, 'H1' | 'H2'];

    const yearDiff = Number(rightYear) - Number(leftYear);

    if (yearDiff !== 0) {
      return yearDiff;
    }

    if (leftHalf === rightHalf) {
      return 0;
    }

    return rightHalf === 'H2' ? 1 : -1;
  });
}

export function isDateInHalfYear(
  dateInput: string | Date | Dayjs,
  period: HalfYearPeriod
) {
  const { start, end } = getPeriodDateRange(period);
  const date = dayjs(dateInput);

  return (
    (date.isAfter(start) || date.isSame(start, 'day')) &&
    (date.isBefore(end) || date.isSame(end, 'day'))
  );
}

export function getHalfYearLabel(period: HalfYearPeriod) {
  const [year, half] = period.split('-') as [string, 'H1' | 'H2'];
  return `${half === 'H1' ? 'חציון א׳' : 'חציון ב׳'} ${year}`;
}

export function formatDisplayDate(value: string) {
  return dayjs(value).format('DD/MM/YYYY');
}

export function formatDisplayTime(value: string | null) {
  return value ? value.slice(0, 5) : 'ללא שעה';
}

export function getMonthDateRange(referenceDate = dayjs()) {
  return {
    end: referenceDate.endOf('month'),
    start: referenceDate.startOf('month'),
  };
}

export function getWeekDateRange(referenceDate = dayjs()) {
  const dayOffset = referenceDate.day();
  const start = referenceDate.subtract(dayOffset, 'day').startOf('day');

  return {
    end: start.add(6, 'day').endOf('day'),
    start,
  };
}
