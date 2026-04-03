import dayjs from 'dayjs';

import { createDataAccessError } from '@/src/lib/error-utils';
import { getMonthDateRange, getWeekDateRange } from '@/src/lib/date-utils';
import { supabase } from '@/src/lib/supabase';
import type { Alert, Settlement, Training } from '@/src/types/database';

type TrainingLinkRow = {
  settlement_id: string;
  training_id: string;
};

export type DashboardAlertItem = Pick<
  Alert,
  'created_at' | 'description' | 'id' | 'severity' | 'status' | 'title' | 'type'
> & {
  related_settlement_name?: string | null;
};

export type DashboardUpcomingTraining = Pick<
  Training,
  'id' | 'status' | 'title' | 'training_date' | 'training_time' | 'training_type'
> & {
  settlements: string[];
};

export type DashboardOverview = {
  activeSettlementsCount: number;
  alertsSummary: DashboardAlertItem[];
  completedTrainingsThisMonth: number;
  missingFeedbackCount: number;
  systemStatus: 'מבצעי';
  trainingsThisWeek: number;
  upcomingTrainings: DashboardUpcomingTraining[];
};

function isBetween(dateValue: string, start: dayjs.Dayjs, end: dayjs.Dayjs) {
  const date = dayjs(dateValue);

  return (
    (date.isAfter(start) || date.isSame(start, 'day')) &&
    (date.isBefore(end) || date.isSame(end, 'day'))
  );
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const monthRange = getMonthDateRange();
  const weekRange = getWeekDateRange();
  const today = dayjs().format('YYYY-MM-DD');

  const [
    { data: settlements, error: settlementsError },
    { data: trainings, error: trainingsError },
    { data: alerts, error: alertsError },
    { data: trainingLinks, error: trainingLinksError },
    { data: feedbacks, error: feedbacksError },
  ] = await Promise.all([
    supabase.from('settlements').select('id, is_active, name').order('name'),
    supabase
      .from('trainings')
      .select('id, title, training_type, training_date, training_time, status')
      .order('training_date', { ascending: true }),
    supabase
      .from('alerts')
      .select(
        `
          id,
          type,
          title,
          description,
          severity,
          status,
          created_at,
          settlement:settlements!alerts_related_settlement_id_fkey (
            name
          )
        `
      )
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('training_settlements').select('training_id, settlement_id'),
    supabase.from('feedbacks').select('id, training_id, settlement_id'),
  ]);

  if (settlementsError) {
    throw createDataAccessError(settlementsError, 'לא ניתן לטעון את תמונת מצב היישובים');
  }

  if (trainingsError) {
    throw createDataAccessError(trainingsError, 'לא ניתן לטעון את נתוני האימונים');
  }

  if (alertsError) {
    throw createDataAccessError(alertsError, 'לא ניתן לטעון את נתוני ההתראות');
  }

  if (trainingLinksError) {
    throw createDataAccessError(trainingLinksError, 'לא ניתן לטעון את שיוכי האימונים');
  }

  if (feedbacksError) {
    throw createDataAccessError(feedbacksError, 'לא ניתן לטעון את נתוני המשובים');
  }

  const settlementLinksByTraining = new Map<string, string[]>();

  ((trainingLinks ?? []) as TrainingLinkRow[]).forEach((link) => {
    settlementLinksByTraining.set(link.training_id, [
      ...(settlementLinksByTraining.get(link.training_id) ?? []),
      link.settlement_id,
    ]);
  });

  const settlementNamesById = new Map(
    (settlements ?? []).map((settlement) => [settlement.id, settlement.name])
  );

  const completedTrainingsThisMonth = (trainings ?? []).filter(
    (training) =>
      training.status === 'הושלם' &&
      isBetween(training.training_date, monthRange.start, monthRange.end)
  ).length;

  const trainingsThisWeek = (trainings ?? []).filter(
    (training) =>
      training.status !== 'בוטל' &&
      isBetween(training.training_date, weekRange.start, weekRange.end)
  ).length;

  const completedLinks = ((trainingLinks ?? []) as TrainingLinkRow[]).filter((link) =>
    (trainings ?? []).some(
      (training) => training.id === link.training_id && training.status === 'הושלם'
    )
  );

  const feedbackPairs = new Set(
    (feedbacks ?? []).map((feedback) => `${feedback.training_id}:${feedback.settlement_id}`)
  );

  const missingFeedbackCount = completedLinks.filter(
    (link) => !feedbackPairs.has(`${link.training_id}:${link.settlement_id}`)
  ).length;

  const upcomingTrainings = (trainings ?? [])
    .filter(
      (training) =>
        training.status !== 'בוטל' &&
        training.training_date >= today
    )
    .slice(0, 5)
    .map((training) => ({
      ...training,
      settlements: (settlementLinksByTraining.get(training.id) ?? [])
        .map((settlementId) => settlementNamesById.get(settlementId) ?? settlementId),
    }));

  return {
    activeSettlementsCount: (settlements ?? []).filter((item) => item.is_active).length,
    alertsSummary: ((alerts ?? []) as Array<
      DashboardAlertItem & {
        settlement?: { name: string } | null;
      }
    >).map((item) => ({
      created_at: item.created_at,
      description: item.description,
      id: item.id,
      related_settlement_name: item.settlement?.name ?? null,
      severity: item.severity,
      status: item.status,
      title: item.title,
      type: item.type,
    })),
    completedTrainingsThisMonth,
    missingFeedbackCount,
    systemStatus: 'מבצעי',
    trainingsThisWeek,
    upcomingTrainings,
  };
}
