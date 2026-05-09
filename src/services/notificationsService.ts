import dayjs from 'dayjs';

import { canManageOperationalData } from '@/src/features/auth/lib/permissions';
import { fetchUserProfile } from '@/src/features/auth/api/profile-service';
import {
  formatDisplayDate,
  formatDisplayTimeRange,
  getCurrentHalfYearPeriod,
  getHalfYearLabel,
  getPeriodDateRange,
  getYearDateRange,
  isDateInHalfYear,
} from '@/src/lib/date-utils';
import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type {
  AuthProfile,
  Feedback,
  Json,
  Settlement,
  Training,
  UserProfile,
} from '@/src/types/database';
import { canUserSeeTraining } from '@/src/utils/permissionScope';

export type NotificationSeverity = 'danger' | 'info' | 'success' | 'warning';
export type NotificationStatus = 'dismissed' | 'read' | 'unread';
export type NotificationType =
  | 'general'
  | 'missing_defense_training'
  | 'missing_half_year_range'
  | 'missing_report'
  | 'new_feedback'
  | 'upcoming_training';

export type HomeNotification = {
  action_params: Json | null;
  action_screen: string | null;
  badgeLabel: string;
  body: string;
  created_at: string;
  id: string;
  severity: NotificationSeverity;
  settlement_id: string | null;
  source: 'computed' | 'stored';
  status: NotificationStatus;
  title: string;
  training_id: string | null;
  type: NotificationType;
};

type TrainingNotificationRow = Pick<
  Training,
  | 'end_time'
  | 'id'
  | 'instructor_id'
  | 'status'
  | 'title'
  | 'training_date'
  | 'training_time'
  | 'training_type'
> & {
  feedbacks?: Array<Pick<Feedback, 'id'>>;
  instructor?: Pick<UserProfile, 'full_name' | 'id'> | null;
  training_settlements: Array<{
    settlement:
      | (Pick<Settlement, 'area' | 'council_id' | 'id' | 'name' | 'regional_council'> & {
          council?: { plaga_name: string | null } | null;
        })
      | null;
  }>;
};

type StoredNotificationRow = {
  action_params: Json | null;
  action_screen: string | null;
  body: string;
  created_at: string;
  id: string;
  settlement_id: string | null;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  training_id: string | null;
  type: NotificationType;
};

type ComplianceTrainingRow = Pick<Training, 'training_date' | 'training_type'> & {
  training_settlements: Array<{ settlement_id: string }>;
};

const HOME_NOTIFICATIONS_LIMIT = 5;
const COMPUTED_LOOKBACK_DAYS = 14;
const UPCOMING_DAYS = 30;
const IMMINENT_DAYS = 7;

const severityRank: Record<NotificationSeverity, number> = {
  danger: 0,
  warning: 1,
  info: 2,
  success: 3,
};

function isMissingNotificationsTableError(error: unknown) {
  const message = getErrorMessage(error, '');

  return (
    message.includes('notifications') &&
    (message.includes('relation') ||
      message.includes('schema cache') ||
      message.includes('does not exist'))
  );
}

function getTrainingDateTime(training: Pick<Training, 'training_date' | 'training_time'>) {
  return training.training_time
    ? dayjs(`${training.training_date}T${training.training_time}`)
    : dayjs(training.training_date).hour(8).minute(0).second(0);
}

function getFirstSettlement(training: TrainingNotificationRow) {
  return (
    training.training_settlements
      .map((link) => link.settlement)
      .find((settlement): settlement is NonNullable<typeof settlement> => Boolean(settlement)) ??
    null
  );
}

function getTrainingScopeLabel(training: TrainingNotificationRow) {
  const settlementNames = training.training_settlements
    .map((link) => link.settlement?.name)
    .filter((name): name is string => Boolean(name));

  if (!settlementNames.length) {
    return training.training_type;
  }

  if (settlementNames.length === 1) {
    return settlementNames[0];
  }

  return `${settlementNames[0]} ועוד ${settlementNames.length - 1}`;
}

function getUpcomingBadge(training: TrainingNotificationRow) {
  const daysUntil = getTrainingDateTime(training).startOf('day').diff(dayjs().startOf('day'), 'day');

  if (daysUntil === 0) {
    return 'היום';
  }

  if (daysUntil === 1) {
    return 'מחר';
  }

  return `בעוד ${daysUntil} ימים`;
}

function normalizeStoredNotification(item: StoredNotificationRow): HomeNotification {
  return {
    action_params: item.action_params,
    action_screen: item.action_screen,
    badgeLabel: item.status === 'unread' ? 'חדש' : 'נקרא',
    body: item.body,
    created_at: item.created_at,
    id: item.id,
    settlement_id: item.settlement_id,
    severity: item.severity,
    source: 'stored',
    status: item.status,
    title: item.title,
    training_id: item.training_id,
    type: item.type,
  };
}

function dedupeNotifications(notifications: HomeNotification[]) {
  const seen = new Set<string>();

  return notifications.filter((notification) => {
    const key = [
      notification.type,
      notification.training_id ?? 'no-training',
      notification.settlement_id ?? 'no-settlement',
      notification.title,
    ].join(':');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sortNotifications(notifications: HomeNotification[]) {
  return [...notifications].sort((left, right) => {
    const severityDiff = severityRank[left.severity] - severityRank[right.severity];

    if (severityDiff !== 0) {
      return severityDiff;
    }

    const leftUnread = left.status === 'unread' ? 0 : 1;
    const rightUnread = right.status === 'unread' ? 0 : 1;

    if (leftUnread !== rightUnread) {
      return leftUnread - rightUnread;
    }

    const leftDate = dayjs(left.created_at).valueOf();
    const rightDate = dayjs(right.created_at).valueOf();

    return rightDate - leftDate;
  });
}

async function getCurrentApprovedProfile() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לזהות את המשתמש המחובר');
  }

  if (!data.user) {
    return null;
  }

  const profile = await fetchUserProfile(data.user.id);

  if (!profile?.is_active || profile.approval_status !== 'approved') {
    return null;
  }

  return profile;
}

async function listStoredNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, type, title, body, severity, status, training_id, settlement_id, action_screen, action_params, created_at'
    )
    .neq('status', 'dismissed')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    if (isMissingNotificationsTableError(error)) {
      return [];
    }

    throw createDataAccessError(error, 'לא ניתן לטעון התראות שמורות');
  }

  return ((data ?? []) as StoredNotificationRow[]).map(normalizeStoredNotification);
}

async function listComputedTrainingNotifications(profile: AuthProfile) {
  const today = dayjs().format('YYYY-MM-DD');
  const upcomingEnd = dayjs().add(UPCOMING_DAYS, 'day').format('YYYY-MM-DD');
  const missingReportStart = dayjs().subtract(COMPUTED_LOOKBACK_DAYS, 'day').format('YYYY-MM-DD');

  const [
    { data: upcomingTrainings, error: upcomingTrainingsError },
    { data: completedTrainings, error: completedTrainingsError },
    { data: latestFeedbacks, error: latestFeedbacksError },
  ] = await Promise.all([
    supabase
      .from('trainings')
      .select(
        `
          id,
          title,
          training_type,
          training_date,
          training_time,
          end_time,
          status,
          instructor_id,
          training_settlements (
            settlement:settlements (
              id,
              name,
              area,
              regional_council,
              council_id,
              council:regional_councils (
                plaga_name
              )
            )
          )
        `
      )
      .neq('status', 'בוטל')
      .gte('training_date', today)
      .lte('training_date', upcomingEnd)
      .order('training_date', { ascending: true })
      .order('training_time', { ascending: true, nullsFirst: false })
      .limit(20),
    canManageOperationalData(profile.role)
      ? supabase
          .from('trainings')
          .select(
            `
              id,
              title,
              training_type,
              training_date,
              training_time,
              end_time,
              status,
              instructor_id,
              feedbacks (
                id
              ),
              training_settlements (
                settlement:settlements (
                  id,
                  name,
                  area,
                  regional_council,
                  council_id,
                  council:regional_councils (
                    plaga_name
                  )
                )
              )
            `
          )
          .eq('status', 'הושלם')
          .gte('training_date', missingReportStart)
          .lt('training_date', today)
          .order('training_date', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('feedbacks')
      .select(
        `
          id,
          created_at,
          training_id,
          instructor:users_profile!feedbacks_instructor_id_fkey (
            id,
            full_name
          ),
          training:trainings!feedbacks_training_id_fkey (
            id,
            title,
            training_type,
            training_date,
            training_time,
            end_time,
            status,
            instructor_id,
            training_settlements (
              settlement:settlements (
                id,
                name,
                area,
                regional_council,
                council_id,
                council:regional_councils (
                  plaga_name
                )
              )
            )
          )
        `
      )
      .eq('is_training_level', true)
      .gte('created_at', dayjs().subtract(7, 'day').toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (upcomingTrainingsError) {
    throw createDataAccessError(upcomingTrainingsError, 'לא ניתן לטעון אימונים קרובים להתראות');
  }

  if (completedTrainingsError) {
    throw createDataAccessError(completedTrainingsError, 'לא ניתן לטעון אימונים חסרי דוח');
  }

  if (latestFeedbacksError) {
    throw createDataAccessError(latestFeedbacksError, 'לא ניתן לטעון משובים חדשים להתראות');
  }

  const computed: HomeNotification[] = [];

  ((upcomingTrainings ?? []) as unknown as TrainingNotificationRow[])
    .filter((training) => canUserSeeTraining(profile, training))
    .forEach((training) => {
      const trainingDateTime = getTrainingDateTime(training);
      const daysUntil = trainingDateTime.startOf('day').diff(dayjs().startOf('day'), 'day');
      const firstSettlement = getFirstSettlement(training);
      const isImminent = daysUntil <= IMMINENT_DAYS;

      computed.push({
        action_params: { training_id: training.id },
        action_screen: 'training_details',
        badgeLabel: getUpcomingBadge(training),
        body: `${getTrainingScopeLabel(training)} • ${formatDisplayDate(
          training.training_date
        )} • ${formatDisplayTimeRange(training.training_time, training.end_time)}`,
        created_at: trainingDateTime.toISOString(),
        id: `computed-upcoming-${training.id}`,
        settlement_id: firstSettlement?.id ?? null,
        severity: isImminent ? 'warning' : 'info',
        source: 'computed',
        status: 'unread',
        title: isImminent ? `אימון קרוב בעוד ${Math.max(daysUntil, 0)} ימים` : 'אימון נקבע לחודש הקרוב',
        training_id: training.id,
        type: 'upcoming_training',
      });
    });

  ((completedTrainings ?? []) as unknown as TrainingNotificationRow[])
    .filter((training) => canUserSeeTraining(profile, training))
    .filter((training) => !(training.feedbacks ?? []).length)
    .forEach((training) => {
      const endedAt = training.end_time
        ? dayjs(`${training.training_date}T${training.end_time}`)
        : dayjs(training.training_date).endOf('day');
      const hoursSinceEnd = dayjs().diff(endedAt, 'hour');
      const firstSettlement = getFirstSettlement(training);

      computed.push({
        action_params: { openFeedback: '1', training_id: training.id },
        action_screen: 'training_details',
        badgeLabel: 'לטיפול',
        body: `האימון התקיים בתאריך ${formatDisplayDate(training.training_date)} ועדיין לא מולא סיכום.`,
        created_at: endedAt.toISOString(),
        id: `computed-missing-report-${training.id}`,
        settlement_id: firstSettlement?.id ?? null,
        severity: hoursSinceEnd > 24 ? 'danger' : 'warning',
        source: 'computed',
        status: 'unread',
        title: 'חסר דוח סיכום לאימון',
        training_id: training.id,
        type: 'missing_report',
      });
    });

  (
    (latestFeedbacks ?? []) as unknown as Array<
      Pick<Feedback, 'created_at' | 'id' | 'training_id'> & {
        instructor: Pick<UserProfile, 'full_name' | 'id'> | null;
        training: TrainingNotificationRow | null;
      }
    >
  ).forEach((feedback) => {
    if (!feedback.training || !canUserSeeTraining(profile, feedback.training)) {
      return;
    }

    const firstSettlement = getFirstSettlement(feedback.training);

    computed.push({
      action_params: { training_id: feedback.training.id },
      action_screen: 'training_details',
      badgeLabel: 'חדש',
      body: `עבור אימון: ${feedback.training.title} • מאת: ${
        feedback.instructor?.full_name ?? 'מדריך'
      }`,
      created_at: feedback.created_at,
      id: `computed-new-feedback-${feedback.id}`,
      settlement_id: firstSettlement?.id ?? null,
      severity: 'success',
      source: 'computed',
      status: 'unread',
      title: 'התקבל משוב חדש',
      training_id: feedback.training.id,
      type: 'new_feedback',
    });
  });

  return computed;
}

async function listComputedComplianceNotifications() {
  const currentHalfYear = getCurrentHalfYearPeriod();
  const currentHalfYearRange = getPeriodDateRange(currentHalfYear);
  const currentYearRange = getYearDateRange();

  const [
    { data: settlements, error: settlementsError },
    { data: complianceTrainings, error: complianceTrainingsError },
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select('id, name, area, regional_council, council_id, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(100),
    supabase
      .from('trainings')
      .select(
        `
          training_date,
          training_type,
          training_settlements (
            settlement_id
          )
        `
      )
      .eq('status', 'הושלם')
      .in('training_type', ['מטווח', 'הגנת יישוב'])
      .gte('training_date', currentYearRange.start.format('YYYY-MM-DD'))
      .lte('training_date', currentYearRange.end.format('YYYY-MM-DD')),
  ]);

  if (settlementsError) {
    throw createDataAccessError(settlementsError, 'לא ניתן לטעון יישובים להתראות כשירות');
  }

  if (complianceTrainingsError) {
    throw createDataAccessError(complianceTrainingsError, 'לא ניתן לטעון אימוני כשירות להתראות');
  }

  const rangeCompleted = new Set<string>();
  const defenseCompleted = new Set<string>();

  ((complianceTrainings ?? []) as ComplianceTrainingRow[]).forEach((training) => {
    training.training_settlements.forEach((link) => {
      if (
        training.training_type === 'מטווח' &&
        isDateInHalfYear(training.training_date, currentHalfYear)
      ) {
        rangeCompleted.add(link.settlement_id);
      }

      if (training.training_type === 'הגנת יישוב') {
        defenseCompleted.add(link.settlement_id);
      }
    });
  });

  return ((settlements ?? []) as Settlement[]).flatMap((settlement) => {
    const notifications: HomeNotification[] = [];

    if (!rangeCompleted.has(settlement.id)) {
      notifications.push({
        action_params: { settlement_id: settlement.id },
        action_screen: 'settlement_details',
        badgeLabel: 'לטיפול',
        body: `יישוב: ${settlement.name} • יש להשלים עד סוף ${getHalfYearLabel(currentHalfYear)}`,
        created_at: currentHalfYearRange.end.toISOString(),
        id: `computed-missing-range-${settlement.id}`,
        settlement_id: settlement.id,
        severity: 'warning',
        source: 'computed',
        status: 'unread',
        title: 'חסר מטווח חציוני',
        training_id: null,
        type: 'missing_half_year_range',
      });
    }

    if (!defenseCompleted.has(settlement.id)) {
      notifications.push({
        action_params: { settlement_id: settlement.id },
        action_screen: 'settlement_details',
        badgeLabel: 'לטיפול',
        body: `יישוב: ${settlement.name} • חסרה הגנת יישוב לשנת ${dayjs().year()}`,
        created_at: currentYearRange.end.toISOString(),
        id: `computed-missing-defense-${settlement.id}`,
        settlement_id: settlement.id,
        severity: 'warning',
        source: 'computed',
        status: 'unread',
        title: 'חסרה הגנת יישוב',
        training_id: null,
        type: 'missing_defense_training',
      });
    }

    return notifications;
  });
}

export async function buildComputedNotifications(profile: AuthProfile) {
  const [trainingNotifications, complianceNotifications] = await Promise.all([
    listComputedTrainingNotifications(profile),
    listComputedComplianceNotifications(),
  ]);

  return [...trainingNotifications, ...complianceNotifications];
}

export async function getHomeNotificationsForCurrentUser() {
  const profile = await getCurrentApprovedProfile();

  if (!profile) {
    return [];
  }

  const [storedNotifications, computedNotifications] = await Promise.all([
    listStoredNotifications(),
    buildComputedNotifications(profile),
  ]);

  return sortNotifications(dedupeNotifications([...storedNotifications, ...computedNotifications])).slice(
    0,
    HOME_NOTIFICATIONS_LIMIT
  );
}

export async function markNotificationAsRead(notificationId: string) {
  if (notificationId.startsWith('computed-')) {
    return;
  }

  const { error } = await supabase.rpc('mark_notification_as_read', {
    target_notification_id: notificationId,
  });

  if (error && !isMissingNotificationsTableError(error)) {
    throw createDataAccessError(error, 'לא ניתן לסמן התראה כנקראה');
  }
}

export async function dismissNotification(notificationId: string) {
  if (notificationId.startsWith('computed-')) {
    return;
  }

  const { error } = await supabase.rpc('dismiss_notification', {
    target_notification_id: notificationId,
  });

  if (error && !isMissingNotificationsTableError(error)) {
    throw createDataAccessError(error, 'לא ניתן להסתיר את ההתראה');
  }
}

export async function notifyNewFeedbackForTraining(params: {
  excludeUserId?: string | null;
  trainingId: string;
}) {
  const { error } = await supabase.functions.invoke('send-training-reminders', {
    body: {
      eventType: 'new_feedback',
      exclude_user_id: params.excludeUserId ?? null,
      training_id: params.trainingId,
    },
  });

  if (error) {
    throw createDataAccessError(error, 'המשוב נשמר, אך לא ניתן לשלוח פוש כרגע');
  }
}
