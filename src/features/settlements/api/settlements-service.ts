import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import {
  calculateSettlementRanking,
  getCurrentRankingPeriod,
  type ComputedSettlementRanking,
} from '@/src/features/rankings/utils/ranking-calculator';
import type { HalfYearPeriod } from '@/src/lib/date-utils';
import type {
  Alert,
  Feedback,
  Settlement,
  SettlementRanking,
  TablesInsert,
  TablesUpdate,
  Training,
  UserProfile,
} from '@/src/types/database';

export type SettlementListItem = Settlement;

export type SettlementTrainingSummary = Pick<
  Training,
  'id' | 'status' | 'title' | 'training_date' | 'training_time' | 'training_type'
> & {
  location: string | null;
};

export type SettlementFeedbackSummary = Pick<
  Feedback,
  'comment' | 'created_at' | 'id' | 'rating'
> & {
  instructor: Pick<UserProfile, 'full_name' | 'id'> | null;
  training: Pick<Training, 'id' | 'title' | 'training_date' | 'training_type'> | null;
};

export type SettlementAlertSummary = Pick<
  Alert,
  'created_at' | 'description' | 'id' | 'severity' | 'status' | 'title' | 'type'
>;

export type SettlementDetails = Settlement & {
  alerts: SettlementAlertSummary[];
  compliance: ComputedSettlementRanking;
  feedbacks: SettlementFeedbackSummary[];
  rankings: SettlementRanking[];
  trainings: SettlementTrainingSummary[];
};

export async function listSettlements(): Promise<SettlementListItem[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את רשימת היישובים');
  }

  return data ?? [];
}

export async function getSettlementDetails(
  settlementId: string,
  period: HalfYearPeriod = getCurrentRankingPeriod()
): Promise<SettlementDetails> {
  const [
    { data: settlement, error: settlementError },
    { data: rankings, error: rankingsError },
    { data: trainingLinks, error: trainingLinksError },
    { data: feedbacks, error: feedbacksError },
    { data: alerts, error: alertsError },
  ] = await Promise.all([
      supabase
        .from('settlements')
        .select('*')
        .eq('id', settlementId)
        .maybeSingle(),
      supabase
        .from('settlement_rankings')
        .select('*')
        .eq('settlement_id', settlementId)
        .order('calculated_at', { ascending: false }),
      supabase
        .from('training_settlements')
        .select(
          `
            settlement_id,
            training:trainings (
              id,
              title,
              training_type,
              location,
              training_date,
              training_time,
              status
            )
          `
        )
        .eq('settlement_id', settlementId),
      supabase
        .from('feedbacks')
        .select(
          `
            id,
            rating,
            comment,
            created_at,
            instructor:users_profile!feedbacks_instructor_id_fkey (
              id,
              full_name
            ),
            training:trainings!feedbacks_training_id_fkey (
              id,
              title,
              training_type,
              training_date
            )
          `
        )
        .eq('settlement_id', settlementId)
        .order('created_at', { ascending: false }),
      supabase
        .from('alerts')
        .select('id, type, title, description, severity, status, created_at')
        .eq('related_settlement_id', settlementId)
        .order('created_at', { ascending: false }),
    ]);

  if (settlementError) {
    throw createDataAccessError(settlementError, 'לא ניתן לטעון את פרטי היישוב');
  }

  if (rankingsError) {
    throw createDataAccessError(rankingsError, 'לא ניתן לטעון את דירוגי היישוב');
  }

  if (trainingLinksError) {
    throw createDataAccessError(trainingLinksError, 'לא ניתן לטעון את אימוני היישוב');
  }

  if (feedbacksError) {
    throw createDataAccessError(feedbacksError, 'לא ניתן לטעון את משובי היישוב');
  }

  if (alertsError) {
    throw createDataAccessError(alertsError, 'לא ניתן לטעון את התראות היישוב');
  }

  if (!settlement) {
    throw new Error('היישוב המבוקש לא נמצא');
  }

  const trainings = (
    (trainingLinks ?? []) as Array<{
      settlement_id: string;
      training: SettlementTrainingSummary | null;
    }>
  )
    .map((item) => item.training)
    .filter((training): training is SettlementTrainingSummary => Boolean(training))
    .sort((left, right) =>
      `${right.training_date}${right.training_time ?? ''}`.localeCompare(
        `${left.training_date}${left.training_time ?? ''}`
      )
    );

  const typedFeedbacks = (feedbacks ?? []) as SettlementFeedbackSummary[];
  const compliance = calculateSettlementRanking({
    feedbacks: typedFeedbacks
      .filter((feedback) => Boolean(feedback.training))
      .map((feedback) => ({
        created_at: feedback.created_at,
        rating: feedback.rating,
        settlement_id: settlementId,
      })),
    period,
    settlement,
    trainings: ((trainingLinks ?? []) as Array<{
      settlement_id: string;
      training: SettlementTrainingSummary | null;
    }>).map((item) => ({
      settlement_id: item.settlement_id,
      training: item.training
        ? {
            id: item.training.id,
            status: item.training.status,
            title: item.training.title,
            training_date: item.training.training_date,
            training_type: item.training.training_type,
          }
        : null,
    })),
  });

  return {
    alerts: (alerts ?? []) as SettlementAlertSummary[],
    ...settlement,
    compliance,
    feedbacks: typedFeedbacks,
    rankings: rankings ?? [],
    trainings,
  };
}

export async function createSettlement(
  values: TablesInsert<'settlements'>
): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .insert(values)
    .select('*')
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן ליצור יישוב חדש');
  }

  return data;
}

export async function updateSettlement(
  settlementId: string,
  values: TablesUpdate<'settlements'>
): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .update(values)
    .eq('id', settlementId)
    .select('*')
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לעדכן את פרטי היישוב');
  }

  return data;
}

export async function deleteSettlement(settlementId: string) {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', settlementId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן למחוק את היישוב');
  }
}
