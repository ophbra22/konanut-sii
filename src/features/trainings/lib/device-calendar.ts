import dayjs from 'dayjs';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import type { TrainingDetails } from '@/src/features/trainings/api/trainings-service';
import { getPresentableErrorMessage } from '@/src/lib/error-utils';

const APP_CALENDAR_NAME = 'כוננות שיא';
const DEFAULT_EVENT_DURATION_MINUTES = 90;
const DEFAULT_EVENT_START_HOUR = 9;
const WRITABLE_ANDROID_ACCESS_LEVELS = new Set<Calendar.CalendarAccessLevel>([
  Calendar.CalendarAccessLevel.CONTRIBUTOR,
  Calendar.CalendarAccessLevel.EDITOR,
  Calendar.CalendarAccessLevel.OVERRIDE,
  Calendar.CalendarAccessLevel.OWNER,
  Calendar.CalendarAccessLevel.ROOT,
]);

export type DeviceCalendarErrorCode =
  | 'calendar_unavailable'
  | 'calendar_write_unavailable'
  | 'permission_blocked'
  | 'permission_denied'
  | 'unknown';

export class DeviceCalendarError extends Error {
  code: DeviceCalendarErrorCode;

  constructor(code: DeviceCalendarErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function isWritableCalendar(calendar: Calendar.Calendar) {
  if (!calendar.allowsModifications) {
    return false;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  if (!calendar.accessLevel) {
    return true;
  }

  return WRITABLE_ANDROID_ACCESS_LEVELS.has(calendar.accessLevel);
}

function buildTrainingStartDate(training: TrainingDetails) {
  if (!training.training_time) {
    return dayjs(training.training_date)
      .hour(DEFAULT_EVENT_START_HOUR)
      .minute(0)
      .second(0)
      .millisecond(0);
  }

  return dayjs(`${training.training_date}T${training.training_time}`);
}

function buildTrainingNotes(training: TrainingDetails) {
  const settlementsLabel = training.settlements.length
    ? training.settlements.map((settlement) => settlement.name).join(', ')
    : 'לא הוגדרו יישובים';

  return [
    `סוג אימון: ${training.training_type}`,
    `מדריך: ${training.instructor?.full_name ?? 'לא הוגדר'}`,
    `יישובים: ${settlementsLabel}`,
    `סטטוס: ${training.status}`,
    training.training_time ? null : 'שעת התחלה לא הוגדרה במערכת. האירוע נוסף ליומן החל מ-09:00.',
    training.notes?.trim() ? `הערות: ${training.notes.trim()}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

async function ensureCalendarPermission() {
  const isAvailable = await Calendar.isAvailableAsync();

  if (!isAvailable) {
    throw new DeviceCalendarError(
      'calendar_unavailable',
      'יומן המכשיר אינו זמין במכשיר הזה'
    );
  }

  const currentPermission = await Calendar.getCalendarPermissionsAsync();

  if (currentPermission.granted) {
    return;
  }

  const requestedPermission = await Calendar.requestCalendarPermissionsAsync();

  if (requestedPermission.granted) {
    return;
  }

  if (requestedPermission.canAskAgain) {
    throw new DeviceCalendarError(
      'permission_denied',
      'כדי להוסיף את האימון ליומן צריך לאשר גישה ליומן המכשיר'
    );
  }

  throw new DeviceCalendarError(
    'permission_blocked',
    'הגישה ליומן חסומה. אפשר לאפשר אותה דרך הגדרות המכשיר'
  );
}

async function createFallbackCalendar() {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();

    return Calendar.createCalendarAsync({
      color: '#4C7DFF',
      entityType: Calendar.EntityTypes.EVENT,
      name: 'konanut-sii',
      source: defaultCalendar.source,
      sourceId: defaultCalendar.source.id,
      title: APP_CALENDAR_NAME,
    });
  }

  return Calendar.createCalendarAsync({
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    color: '#4C7DFF',
    entityType: Calendar.EntityTypes.EVENT,
    name: 'konanut-sii',
    ownerAccount: 'personal',
    source: {
      isLocalAccount: true,
      name: APP_CALENDAR_NAME,
      type: Calendar.SourceType.LOCAL,
    },
    title: APP_CALENDAR_NAME,
  });
}

async function resolveWritableCalendarId() {
  if (Platform.OS === 'ios') {
    try {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();

      if (isWritableCalendar(defaultCalendar)) {
        return defaultCalendar.id;
      }
    } catch {
      // Continue to the broader calendar lookup below.
    }
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const primaryCalendar = calendars.find(
    (calendar) => isWritableCalendar(calendar) && calendar.isPrimary
  );

  if (primaryCalendar) {
    return primaryCalendar.id;
  }

  const writableCalendar = calendars.find(isWritableCalendar);

  if (writableCalendar) {
    return writableCalendar.id;
  }

  return createFallbackCalendar();
}

export async function addTrainingToDeviceCalendar(training: TrainingDetails) {
  try {
    await ensureCalendarPermission();
    const calendarId = await resolveWritableCalendarId();
    const startDate = buildTrainingStartDate(training);
    const endDate = startDate.add(DEFAULT_EVENT_DURATION_MINUTES, 'minute');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return await Calendar.createEventAsync(calendarId, {
      endDate: endDate.toDate(),
      location: training.location?.trim() || undefined,
      notes: buildTrainingNotes(training),
      startDate: startDate.toDate(),
      timeZone,
      title: training.title,
    });
  } catch (error) {
    if (error instanceof DeviceCalendarError) {
      throw error;
    }

    throw new DeviceCalendarError(
      'unknown',
      getPresentableErrorMessage(error, 'לא ניתן להוסיף את האימון ליומן')
    );
  }
}
