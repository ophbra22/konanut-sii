import { useMutation } from '@tanstack/react-query';

import { createDataAccessError } from '@/src/lib/error-utils';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { supabase } from '@/src/lib/supabase';
import { listCouncils } from '@/src/features/councils/api/councils-service';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type {
  Feedback,
  Settlement,
  Training,
} from '@/src/types/database';
import {
  calculateSettlementRanking,
  compareSettlementRankings,
  getCurrentRankingPeriod,
  type ComputedSettlementRanking,
  type RankingPeriod,
} from '@/src/features/rankings/utils/ranking-calculator';
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
    'id' | 'status' | 'title' | 'training_date' | 'training_type'
  > | null;
};

export type SettlementRankingListItem = ComputedSettlementRanking & {
  calculatedAt: string;
  regionalSquadName: string | null;
};

export async function listComputedSettlementRankings(
  period: RankingPeriod = getCurrentRankingPeriod()
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
          status
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
            training: link.training,
          })),
      })
    )
    .sort(compareSettlementRankings);
}

export async function listSettlementRankings(
  period: RankingPeriod = getCurrentRankingPeriod()
): Promise<SettlementRankingListItem[]> {
  const [rankings, councils] = await Promise.all([
    listComputedSettlementRankings(period),
    listCouncils(),
  ]);
  const councilById = new Map(councils.map((council) => [council.id, council]));
  const calculatedAt = new Date().toISOString();

  return rankings.map((ranking) => ({
    ...ranking,
    calculatedAt,
    regionalSquadName: ranking.councilId
      ? councilById.get(ranking.councilId)?.regional_squad_name ?? null
      : null,
  }));
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
