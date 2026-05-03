import { useMutation } from '@tanstack/react-query';

import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { supabase } from '@/src/lib/supabase';
import { listCouncils } from '@/src/features/councils/api/councils-service';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type {
  Database,
  Feedback,
  Json,
  Settlement,
  SettlementRanking,
  Training,
} from '@/src/types/database';
import {
  calculateSettlementRanking,
  getCurrentRankingPeriod,
  type ComputedSettlementRanking,
} from '@/src/features/rankings/utils/ranking-calculator';
import { normalizeTrainingSettlementAttendance } from '@/src/features/trainings/lib/training-attendance-utils';
import {
  getRecentHalfYearPeriods,
  isHalfYearPeriod,
  sortHalfYearPeriodsDesc,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';

type RankingTrainingLink = {
  settlement_id: string;
  training: Pick<
    Training,
    'id' | 'settlement_attendance' | 'status' | 'title' | 'training_date' | 'training_type'
  > | null;
};

type SettlementRankingQueryRow = SettlementRanking & {
  settlement:
    | Pick<Settlement, 'area' | 'council_id' | 'id' | 'name' | 'regional_council'>
    | null;
};

type GlobalSettlementRankingRow =
  Database['public']['Functions']['list_global_settlement_rankings']['Returns'][number];

export type SettlementRankingListItem = {
  area: string;
  averageRating: number | null;
  baseScore: number;
  calculatedAt: string;
  councilId: string | null;
  councilName: string | null;
  defenseCompleted: boolean;
  feedbackScore: number;
  finalScore: number;
  halfYearPeriod: HalfYearPeriod;
  instructorFeedbackPoints: number;
  medianRangeParticipationPercent: number | null;
  rankingLevel: ComputedSettlementRanking['rankingLevel'];
  regionalCouncil: string | null;
  regionalSquadName: string | null;
  settlementId: string;
  settlementDefenseParticipationPercent: number | null;
  settlementName: string;
  shootingCompleted: boolean;
  trainingScore: number;
};

function shouldFallbackToLegacyRankingQuery(error: unknown) {
  const message = getErrorMessage(error, '');

  return (
    message.includes('list_global_settlement_rankings') &&
    (message.includes('function') || message.includes('schema cache'))
  );
}

function mapSettlementRankingRow(item: {
  calculated_at: string;
  council_id?: string | null;
  council_name?: string | null;
  defense_completed: boolean;
  feedback_score: number;
  final_score: number;
  half_year_period: string;
  instructor_feedback_points?: number;
  median_range_participation_percent?: number | null;
  ranking_level: string;
  regional_council: string | null;
  regional_squad_name?: string | null;
  settlement_id: string;
  settlement_defense_participation_percent?: number | null;
  settlement_name: string;
  shooting_completed: boolean;
  training_score: number;
  base_score?: number;
  area?: string | null;
  plaga_name?: string | null;
}) {
  return {
    area: item.plaga_name ?? item.area ?? '',
    averageRating: null,
    baseScore: item.base_score ?? item.training_score,
    calculatedAt: item.calculated_at,
    councilId: item.council_id ?? null,
    councilName: item.council_name ?? item.regional_council,
    defenseCompleted: item.defense_completed,
    feedbackScore: item.feedback_score,
    finalScore: item.final_score,
    halfYearPeriod: item.half_year_period as HalfYearPeriod,
    instructorFeedbackPoints: item.instructor_feedback_points ?? item.feedback_score,
    medianRangeParticipationPercent: item.median_range_participation_percent ?? null,
    rankingLevel: item.ranking_level as ComputedSettlementRanking['rankingLevel'],
    regionalCouncil: item.council_name ?? item.regional_council,
    regionalSquadName: item.regional_squad_name ?? null,
    settlementId: item.settlement_id,
    settlementDefenseParticipationPercent:
      item.settlement_defense_participation_percent ?? null,
    settlementName: item.settlement_name,
    shootingCompleted: item.shooting_completed,
    trainingScore: item.training_score,
  };
}

export async function listComputedSettlementRankings(
  period: HalfYearPeriod = getCurrentRankingPeriod()
): Promise<ComputedSettlementRanking[]> {
  const [
    { data: settlements, error: settlementsError },
    councils,
    { data: trainingLinks, error: trainingLinksError },
    { data: feedbacks, error: feedbacksError },
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select(
        `
          id,
          name,
          area,
          regional_council,
          council_id
        `
      )
      .order('name'),
    listCouncils(),
    supabase.from('training_settlements').select(
      `
        settlement_id,
        training:trainings (
          id,
          title,
          training_type,
          training_date,
          status,
          settlement_attendance
        )
      `
    ),
    supabase.from('feedbacks').select('settlement_id, training_id, rating, is_training_level'),
  ]);

  if (settlementsError) {
    throw createDataAccessError(settlementsError, 'לא ניתן לטעון את היישובים לדירוג');
  }

  if (trainingLinksError) {
    throw createDataAccessError(trainingLinksError, 'לא ניתן לטעון את נתוני האימונים לדירוג');
  }

  if (feedbacksError) {
    throw createDataAccessError(feedbacksError, 'לא ניתן לטעון את נתוני המשובים לדירוג');
  }

  const councilById = new Map(councils.map((council) => [council.id, council]));

  return ((settlements ?? []) as Array<
    Pick<Settlement, 'area' | 'council_id' | 'id' | 'name' | 'regional_council'>
  >)
    .map((settlement) =>
      calculateSettlementRanking({
        feedbacks: (feedbacks ?? []) as Pick<
          Feedback,
          'is_training_level' | 'rating' | 'settlement_id' | 'training_id'
        >[],
        period,
        settlement: {
          ...settlement,
          councilName:
            (settlement.council_id ? councilById.get(settlement.council_id)?.name : null) ??
            settlement.regional_council,
        },
        trainings: ((trainingLinks ?? []) as RankingTrainingLink[])
          .filter((link) => link.settlement_id === settlement.id)
          .map((link) => ({
            ...link,
            training: link.training
              ? {
                  ...link.training,
                  settlement_attendance: normalizeTrainingSettlementAttendance(
                    link.training.settlement_attendance as Json | null | undefined
                  ),
                }
              : null,
          })),
      })
    )
    .sort((left, right) => {
      if (right.finalScore !== left.finalScore) {
        return right.finalScore - left.finalScore;
      }

      return left.settlementName.localeCompare(right.settlementName, 'he');
    });
}

export async function listSettlementRankings(
  period: HalfYearPeriod = getCurrentRankingPeriod()
): Promise<SettlementRankingListItem[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'list_global_settlement_rankings',
    {
      period_key: period,
    }
  );

  if (!rpcError) {
    return ((rpcData ?? []) as GlobalSettlementRankingRow[])
      .map((item) => mapSettlementRankingRow(item))
      .sort((left, right) => {
        if (right.finalScore !== left.finalScore) {
          return right.finalScore - left.finalScore;
        }

        return left.settlementName.localeCompare(right.settlementName, 'he');
      });
  }

  if (!shouldFallbackToLegacyRankingQuery(rpcError)) {
    throw createDataAccessError(rpcError, 'לא ניתן לטעון את דירוגי היישובים');
  }

  const councils = await listCouncils();
  const councilById = new Map(councils.map((council) => [council.id, council]));
  const { data, error } = await supabase
    .from('settlement_rankings')
    .select(
      `
        id,
        settlement_id,
        half_year_period,
        shooting_completed,
        defense_completed,
        training_score,
        feedback_score,
        final_score,
        ranking_level,
        base_score,
        instructor_feedback_points,
        median_range_participation_percent,
        settlement_defense_participation_percent,
        calculated_at,
        settlement:settlements!settlement_rankings_settlement_id_fkey (
          id,
          name,
          area,
          regional_council,
          council_id
        )
      `
    )
    .eq('half_year_period', period)
    .order('final_score', { ascending: false });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את דירוגי היישובים');
  }

  return ((data ?? []) as SettlementRankingQueryRow[])
    .filter(
      (item): item is SettlementRankingQueryRow & {
        settlement: NonNullable<SettlementRankingQueryRow['settlement']>;
      } => Boolean(item.settlement)
    )
    .map((item) =>
      mapSettlementRankingRow({
        area: item.settlement.area,
        base_score: item.base_score,
        calculated_at: item.calculated_at,
        council_id: item.settlement.council_id,
        council_name:
          (item.settlement.council_id
            ? councilById.get(item.settlement.council_id)?.name
            : null) ?? item.settlement.regional_council,
        defense_completed: item.defense_completed,
        feedback_score: item.feedback_score,
        final_score: item.final_score,
        half_year_period: item.half_year_period,
        instructor_feedback_points: item.instructor_feedback_points,
        median_range_participation_percent: item.median_range_participation_percent,
        ranking_level: item.ranking_level,
        regional_council: item.settlement.regional_council,
        regional_squad_name:
          item.settlement.council_id
            ? councilById.get(item.settlement.council_id)?.regional_squad_name ?? null
            : null,
        settlement_id: item.settlement_id,
        settlement_defense_participation_percent:
          item.settlement_defense_participation_percent,
        settlement_name: item.settlement.name,
        shooting_completed: item.shooting_completed,
        training_score: item.training_score,
      })
    )
    .sort((left, right) => {
      if (right.finalScore !== left.finalScore) {
        return right.finalScore - left.finalScore;
      }

      return left.settlementName.localeCompare(right.settlementName, 'he');
    });
}

export async function listAvailableRankingPeriods(): Promise<HalfYearPeriod[]> {
  const { data, error } = await supabase
    .from('settlement_rankings')
    .select('half_year_period')
    .order('half_year_period', { ascending: false });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את תקופות הדירוג');
  }

  const savedPeriods = (data ?? [])
    .map((item) => item.half_year_period)
    .filter(isHalfYearPeriod);

  return sortHalfYearPeriodsDesc(
    Array.from(new Set([...savedPeriods, ...getRecentHalfYearPeriods()]))
  );
}

export async function syncSettlementRankings(period: HalfYearPeriod) {
  const rankings = await listComputedSettlementRankings(period);
  const calculatedAt = new Date().toISOString();

  const { error } = await supabase.from('settlement_rankings').upsert(
    rankings.map((item) => ({
      base_score: item.baseScore,
      calculated_at: calculatedAt,
      defense_completed: item.defenseCompleted,
      feedback_score: item.feedbackScore,
      final_score: item.finalScore,
      half_year_period: item.halfYearPeriod,
      instructor_feedback_points: item.instructorFeedbackPoints,
      median_range_participation_percent: item.medianRangeParticipationPercent,
      ranking_level: item.rankingLevel,
      settlement_id: item.settlementId,
      settlement_defense_participation_percent: item.settlementDefenseParticipationPercent,
      shooting_completed: item.shootingCompleted,
      training_score: item.trainingScore,
    })),
    {
      onConflict: 'settlement_id,half_year_period',
    }
  );

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לשמור את חישוב הדירוגים');
  }

  return rankings;
}

export function useSyncSettlementRankingsMutation() {
  const showToast = useFeedbackStore((state) => state.showToast);

  return useMutation({
    mutationFn: (period: HalfYearPeriod) => syncSettlementRankings(period),
    onSuccess: (_, period) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.period(period) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.periods });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      showToast('חישוב הדירוגים נשמר בהצלחה', 'success');
    },
  });
}
