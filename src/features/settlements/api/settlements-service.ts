import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import { listCouncils } from '@/src/features/councils/api/councils-service';
import { normalizeTrainingSettlementAttendance } from '@/src/features/trainings/lib/training-attendance-utils';
import { listComputedSettlementRankings } from '@/src/features/rankings/api/rankings-service';
import {
  calculateSettlementRanking,
  getCurrentRankingPeriod,
  type ComputedSettlementRanking,
} from '@/src/features/rankings/utils/ranking-calculator';
import {
  getCurrentHalfYearPeriod,
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
  TrainingSettlementAttendance,
  UserProfile,
} from '@/src/types/database';

export type SettlementListItem = Settlement & {
  council: Pick<RegionalCouncil, 'id' | 'name' | 'plaga_name' | 'regional_squad_name'> | null;
  councilName: string | null;
  defenseCompletedCurrentYear: boolean;
  readinessCalculatedAt: string | null;
  readinessLevel: string | null;
  readinessScore: number | null;
  shootingCompletedCurrentHalfYear: boolean;
};

export type SettlementTrainingSummary = Pick<
  Training,
  'end_time' | 'id' | 'status' | 'title' | 'training_date' | 'training_time' | 'training_type'
> & {
  location: string | null;
  settlement_attendance: TrainingSettlementAttendance[];
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
  council: Pick<RegionalCouncil, 'id' | 'name' | 'plaga_name' | 'regional_squad_name'> | null;
  councilName: string | null;
  feedbacks: SettlementFeedbackSummary[];
  rankings: SettlementRanking[];
  trainings: SettlementTrainingSummary[];
};

type CouncilSummary = Pick<
  RegionalCouncil,
  'id' | 'name' | 'plaga_name' | 'regional_squad_name'
>;

type SettlementQueryRow = Settlement & {
  council: CouncilSummary | null;
};

function shouldIgnoreRegionalCouncilSyncError(error: unknown) {
  const message = getErrorMessage(error, '');

  return (
    message.includes('regional_councils') &&
    (message.includes('relation') || message.includes('schema cache') || message.includes('column'))
  );
}

async function syncRegionalCouncilPlaga(
  councilId: string | null | undefined,
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
      id: councilId ?? undefined,
      name: normalizedRegionalCouncil,
      plaga_name: normalizedPlaga as RegionalCouncil['plaga_name'],
      regional_squad_name: 'כיתת כוננות אזורית',
      updated_at: new Date().toISOString(),
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

  const [
    { data: settlements, error: settlementsError },
    councils,
    rankings,
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name', { ascending: true }),
    listCouncils(),
    listComputedSettlementRankings(currentHalfYear),
  ]);

  if (settlementsError) {
    throw createDataAccessError(settlementsError, 'לא ניתן לטעון את רשימת היישובים');
  }

  const rankingBySettlement = new Map(rankings.map((ranking) => [ranking.settlementId, ranking]));
  const councilById = new Map(councils.map((council) => [council.id, council]));

  return ((settlements ?? []) as Settlement[]).map((settlement) => {
    const ranking = rankingBySettlement.get(settlement.id);
    const council = settlement.council_id ? councilById.get(settlement.council_id) ?? null : null;

    return {
      ...settlement,
      council,
      councilName: council?.name ?? settlement.regional_council ?? null,
      defenseCompletedCurrentYear: ranking?.defenseCompleted ?? false,
      readinessCalculatedAt: null,
      readinessLevel: ranking?.rankingLevel ?? null,
      readinessScore: ranking?.finalScore ?? 0,
      shootingCompletedCurrentHalfYear: ranking?.shootingCompleted ?? false,
    };
  });
}

export async function getSettlementDetails(
  settlementId: string,
  period: HalfYearPeriod = getCurrentRankingPeriod()
): Promise<SettlementDetails> {
  const [
    { data: settlement, error: settlementError },
    councils,
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
      listCouncils(),
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
              end_time,
              title,
              training_type,
              location,
              training_date,
              training_time,
              status,
              settlement_attendance,
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
        settlement_attendance: normalizeTrainingSettlementAttendance(
          item.training.settlement_attendance
        ),
        settlements,
        status: item.training.status,
        title: item.training.title,
        end_time: item.training.end_time,
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

  const councilById = new Map(councils.map((council) => [council.id, council]));
  const resolvedCouncil = settlement.council_id
    ? councilById.get(settlement.council_id) ?? null
    : null;
  const typedFeedbacks = (feedbacks ?? []) as SettlementFeedbackSummary[];
  const feedbackLinks = typedFeedbacks
    .filter((feedback) => Boolean(feedback.training?.id))
    .map((feedback) => ({
      rating: feedback.rating,
      settlement_id: settlementId,
      training_id: feedback.training!.id,
    }));

  const compliance = calculateSettlementRanking({
    feedbacks: feedbackLinks,
    period,
    settlement: {
      ...settlement,
      councilName: resolvedCouncil?.name ?? settlement.regional_council ?? null,
    },
    trainings: trainings.map((training) => ({
      settlement_id: settlementId,
      training: {
        id: training.id,
        settlement_attendance: training.settlement_attendance,
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
    council: resolvedCouncil,
    councilName: resolvedCouncil?.name ?? settlement.regional_council ?? null,
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

  await syncRegionalCouncilPlaga(values.council_id, values.regional_council, values.area);

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

  await syncRegionalCouncilPlaga(values.council_id, values.regional_council, values.area);

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
