import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import {
  calculateSettlementRanking,
  getCurrentRankingPeriod,
  type ComputedSettlementRanking,
} from '@/src/features/rankings/utils/ranking-calculator';
import {
  getCurrentHalfYearPeriod,
  getYearDateRange,
  isDateInHalfYear,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';
import type {
  Alert,
  Feedback,
  RegionalCouncil,
  Settlement,
  SettlementRanking,
  TablesInsert,
  TablesUpdate,
  Training,
  UserProfile,
} from '@/src/types/database';

export type SettlementListItem = Settlement & {
  defenseCompletedCurrentYear: boolean;
  readinessCalculatedAt: string | null;
  readinessLevel: string | null;
  readinessScore: number | null;
  shootingCompletedCurrentHalfYear: boolean;
};

export type SettlementTrainingSummary = Pick<
  Training,
  'id' | 'status' | 'title' | 'training_date' | 'training_time' | 'training_type'
> & {
  location: string | null;
  settlements: Array<Pick<Settlement, 'id' | 'name'>>;
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

function shouldIgnoreRegionalCouncilSyncError(error: unknown) {
  const message = getErrorMessage(error, '');

  return (
    message.includes('regional_councils') &&
    (message.includes('relation') || message.includes('schema cache') || message.includes('column'))
  );
}

async function syncRegionalCouncilPlaga(
  regionalCouncil: string | null | undefined,
  area: string | null | undefined
) {
  const normalizedRegionalCouncil = regionalCouncil?.trim();
  const normalizedPlaga = area?.trim();

  if (!normalizedRegionalCouncil || !normalizedPlaga) {
    return;
  }

  const { error } = await supabase.from('regional_councils').upsert(
    {
      name: normalizedRegionalCouncil,
      plaga_name: normalizedPlaga as RegionalCouncil['plaga_name'],
    },
    {
      onConflict: 'name',
    }
  );

  if (error && !shouldIgnoreRegionalCouncilSyncError(error)) {
    throw createDataAccessError(error, 'לא ניתן לעדכן את שיוך המועצה לפלגה');
  }
}

export async function listSettlements(): Promise<SettlementListItem[]> {
  const currentHalfYear = getCurrentHalfYearPeriod();
  const currentYearRange = getYearDateRange();

  const [
    { data: settlements, error: settlementsError },
    { data: rankings, error: rankingsError },
    { data: completedTrainings, error: completedTrainingsError },
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name', { ascending: true }),
    supabase
      .from('settlement_rankings')
      .select('settlement_id, final_score, ranking_level, calculated_at')
      .order('calculated_at', { ascending: false }),
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
    throw createDataAccessError(settlementsError, 'לא ניתן לטעון את רשימת היישובים');
  }

  if (rankingsError) {
    throw createDataAccessError(rankingsError, 'לא ניתן לטעון את נתוני המוכנות של היישובים');
  }

  if (completedTrainingsError) {
    throw createDataAccessError(
      completedTrainingsError,
      'לא ניתן לטעון את נתוני העמידה בדרישות האימונים'
    );
  }

  const latestRankingBySettlement = new Map<
    string,
    Pick<
      SettlementRanking,
      'calculated_at' | 'final_score' | 'ranking_level' | 'settlement_id'
    >
  >();

  (rankings ?? []).forEach((ranking) => {
    if (!latestRankingBySettlement.has(ranking.settlement_id)) {
      latestRankingBySettlement.set(ranking.settlement_id, ranking);
    }
  });

  const shootingCompletedSettlementIds = new Set<string>();
  const defenseCompletedSettlementIds = new Set<string>();

  (
    (completedTrainings ?? []) as Array<
      Pick<Training, 'training_date' | 'training_type'> & {
        training_settlements: Array<Pick<TablesInsert<'training_settlements'>, 'settlement_id'>>;
      }
    >
  ).forEach((training) => {
    training.training_settlements.forEach((link) => {
      if (
        training.training_type === 'מטווח' &&
        isDateInHalfYear(training.training_date, currentHalfYear)
      ) {
        shootingCompletedSettlementIds.add(link.settlement_id);
      }

      if (training.training_type === 'הגנת יישוב') {
        defenseCompletedSettlementIds.add(link.settlement_id);
      }
    });
  });

  return (settlements ?? []).map((settlement) => {
    const ranking = latestRankingBySettlement.get(settlement.id);

    return {
      defenseCompletedCurrentYear: defenseCompletedSettlementIds.has(settlement.id),
      ...settlement,
      readinessCalculatedAt: ranking?.calculated_at ?? null,
      readinessLevel: ranking?.ranking_level ?? null,
      readinessScore: ranking?.final_score ?? null,
      shootingCompletedCurrentHalfYear: shootingCompletedSettlementIds.has(settlement.id),
    };
  });
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
              status,
              training_settlements (
                settlement:settlements (
                  id,
                  name
                )
              )
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
      training:
        | (Omit<SettlementTrainingSummary, 'settlements'> & {
            training_settlements: Array<{
              settlement: Pick<Settlement, 'id' | 'name'> | null;
            }>;
          })
        | null;
    }>
  )
    .map((item) => {
      if (!item.training) {
        return null;
      }

      const settlements = (item.training.training_settlements ?? [])
        .map((link) => link.settlement)
        .filter((settlement): settlement is Pick<Settlement, 'id' | 'name'> => Boolean(settlement));

      return {
        id: item.training.id,
        location: item.training.location,
        settlements,
        status: item.training.status,
        title: item.training.title,
        training_date: item.training.training_date,
        training_time: item.training.training_time,
        training_type: item.training.training_type,
      } satisfies SettlementTrainingSummary;
    })
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
    trainings: trainings.map((training) => ({
      settlement_id: settlementId,
      training: {
        id: training.id,
        status: training.status,
        title: training.title,
        training_date: training.training_date,
        training_type: training.training_type,
      },
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

  await syncRegionalCouncilPlaga(values.regional_council, values.area);

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

  await syncRegionalCouncilPlaga(values.regional_council, values.area);

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
