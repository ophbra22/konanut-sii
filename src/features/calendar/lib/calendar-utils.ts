import dayjs, { type Dayjs } from 'dayjs';

export const hebrewMonthLabels = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
] as const;

export const calendarWeekdayLabels = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] as const;
export const calendarWeekdayNames = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'יום שבת',
] as const;

export function formatCalendarMonthLabel(value: Dayjs | string) {
  const date = typeof value === 'string' ? dayjs(value) : value;
  return `${hebrewMonthLabels[date.month()]} ${date.year()}`;
}

export function formatCalendarDayLabel(value: Dayjs | string) {
  const date = typeof value === 'string' ? dayjs(value) : value;

  return `${calendarWeekdayLabels[date.day()]} • ${date.format('DD/MM/YYYY')}`;
}

export function formatCalendarSelectedDateLabel(value: Dayjs | string) {
  const date = typeof value === 'string' ? dayjs(value) : value;

  return `${calendarWeekdayNames[date.day()]}, ${date.date()} ${hebrewMonthLabels[date.month()]}`;
}

export function getCalendarDateKey(value: Dayjs | string) {
  const date = typeof value === 'string' ? dayjs(value) : value;
  return date.format('YYYY-MM-DD');
}

export function buildCalendarMonthGrid(referenceMonth: Dayjs) {
  const monthStart = referenceMonth.startOf('month');
  const gridStart = monthStart.subtract(monthStart.day(), 'day');

  return Array.from({ length: 42 }, (_, index) => gridStart.add(index, 'day'));
}

export function isSameCalendarDay(left: Dayjs | string, right: Dayjs | string) {
  return getCalendarDateKey(left) === getCalendarDateKey(right);
}

export function isSameCalendarMonth(left: Dayjs | string, right: Dayjs | string) {
  const leftDate = typeof left === 'string' ? dayjs(left) : left;
  const rightDate = typeof right === 'string' ? dayjs(right) : right;

  return leftDate.year() === rightDate.year() && leftDate.month() === rightDate.month();
}
