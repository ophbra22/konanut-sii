import dayjs from 'dayjs';

import { createDataAccessError } from '@/src/lib/error-utils';
import {
  getHalfYearPeriod,
  getMonthDateRange,
  getWeekDateRange,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';
import { supabase } from '@/src/lib/supabase';
import type {
  Alert,
  Feedback,
  SettlementRanking,
  Training,
  TrainingSettlement,
} from '@/src/types/database';

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
  averageSettlementScore: number | null;
  currentRankingPeriod: HalfYearPeriod;
  monthlyTrainingsCount: number;
  settlementsMissingFeedbackCount: number;
  systemStatus: 'מבצעי';
  weeklyTrainingsCount: number;
  upcomingTrainings: DashboardUpcomingTraining[];
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const monthRange = getMonthDateRange();
  const weekRange = getWeekDateRange();
  const today = dayjs().format('YYYY-MM-DD');
  const currentRankingPeriod = getHalfYearPeriod();

  const [
    { count: activeSettlementsCount, error: settlementsError },
    { count: weeklyTrainingsCount, error: weeklyTrainingsError },
    { count: monthlyTrainingsCount, error: monthlyTrainingsError },
    { data: rankingRows, error: rankingsError },
    { data: alerts, error: alertsError },
    { data: upcomingTrainings, error: upcomingTrainingsError },
    { data: completedTrainings, error: completedTrainingsError },
    { data: feedbacks, error: feedbacksError },
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('trainings')
      .select('id', { count: 'exact', head: true })
      .gte('training_date', weekRange.start.format('YYYY-MM-DD'))
      .lte('training_date', weekRange.end.format('YYYY-MM-DD')),
    supabase
      .from('trainings')
      .select('id', { count: 'exact', head: true })
      .gte('training_date', monthRange.start.format('YYYY-MM-DD'))
      .lte('training_date', monthRange.end.format('YYYY-MM-DD')),
    supabase
      .from('settlement_rankings')
      .select('final_score')
      .eq('half_year_period', currentRankingPeriod),
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
    supabase
      .from('trainings')
      .select('id, title, training_type, training_date, training_time, status')
      .neq('status', 'בוטל')
      .gte('training_date', today)
      .order('training_date', { ascending: true })
      .order('training_time', { ascending: true, nullsFirst: false })
      .limit(5),
    supabase.from('trainings').select('id').eq('status', 'הושלם'),
    supabase.from('feedbacks').select('training_id, settlement_id'),
  ]);

  if (settlementsError) {
    throw createDataAccessError(settlementsError, 'לא ניתן לטעון את מספר היישובים הפעילים');
  }

  if (weeklyTrainingsError) {
    throw createDataAccessError(weeklyTrainingsError, 'לא ניתן לטעון את אימוני השבוע');
  }

  if (monthlyTrainingsError) {
    throw createDataAccessError(monthlyTrainingsError, 'לא ניתן לטעון את אימוני החודש');
  }

  if (rankingsError) {
    throw createDataAccessError(rankingsError, 'לא ניתן לטעון את ממוצע דירוגי היישובים');
  }

  if (alertsError) {
    throw createDataAccessError(alertsError, 'לא ניתן לטעון את נתוני ההתראות');
  }

  if (upcomingTrainingsError) {
    throw createDataAccessError(upcomingTrainingsError, 'לא ניתן לטעון את רשימת האימונים הקרובים');
  }

  if (completedTrainingsError) {
    throw createDataAccessError(completedTrainingsError, 'לא ניתן לטעון את האימונים שהושלמו');
  }

  if (feedbacksError) {
    throw createDataAccessError(feedbacksError, 'לא ניתן לטעון את נתוני המשובים');
  }

  const completedTrainingIds = (completedTrainings ?? []).map((training) => training.id);

  const [{ data: completedTrainingLinks, error: completedTrainingLinksError }, {
    data: upcomingTrainingLinks,
    error: upcomingTrainingLinksError,
  }] = await Promise.all([
    completedTrainingIds.length
      ? supabase
          .from('training_settlements')
          .select('training_id, settlement_id')
          .in('training_id', completedTrainingIds)
      : Promise.resolve({ data: [], error: null }),
    (upcomingTrainings ?? []).length
      ? supabase
          .from('training_settlements')
          .select(
            `
              training_id,
              settlement:settlements (
                id,
                name
              )
            `
          )
          .in(
            'training_id',
            (upcomingTrainings ?? []).map((training) => training.id)
          )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (completedTrainingLinksError) {
    throw createDataAccessError(completedTrainingLinksError, 'לא ניתן לטעון את שיוכי האימונים שהושלמו');
  }

  if (upcomingTrainingLinksError) {
    throw createDataAccessError(upcomingTrainingLinksError, 'לא ניתן לטעון את שיוכי האימונים הקרובים');
  }

  const feedbackPairs = new Set(
    (feedbacks ?? []).map((feedback) => `${feedback.training_id}:${feedback.settlement_id}`)
  );

  const settlementsMissingFeedbackCount = new Set(
    ((completedTrainingLinks ?? []) as TrainingLinkRow[])
      .filter((link) => !feedbackPairs.has(`${link.training_id}:${link.settlement_id}`))
      .map((link) => link.settlement_id)
  ).size;

  const settlementLinksByTraining = new Map<string, string[]>();

  (
    (upcomingTrainingLinks ?? []) as Array<{
      settlement: { id: string; name: string } | null;
      training_id: string;
    }>
  ).forEach((link) => {
    const settlementName = link.settlement?.name;

    if (!settlementName) {
      return;
    }

    settlementLinksByTraining.set(link.training_id, [
      ...(settlementLinksByTraining.get(link.training_id) ?? []),
      settlementName,
    ]);
  });

  const averageSettlementScore = (rankingRows ?? []).length
    ? Number(
        (
          ((rankingRows ?? []) as Pick<SettlementRanking, 'final_score'>[]).reduce(
            (sum, item) => sum + item.final_score,
            0
          ) / (rankingRows ?? []).length
        ).toFixed(1)
      )
    : null;

  return {
    activeSettlementsCount: activeSettlementsCount ?? 0,
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
    averageSettlementScore,
    currentRankingPeriod,
    monthlyTrainingsCount: monthlyTrainingsCount ?? 0,
    settlementsMissingFeedbackCount,
    systemStatus: 'מבצעי',
    upcomingTrainings: (upcomingTrainings ?? []).map((training) => ({
      ...training,
      settlements: settlementLinksByTraining.get(training.id) ?? [],
    })),
    weeklyTrainingsCount: weeklyTrainingsCount ?? 0,
  };
}
