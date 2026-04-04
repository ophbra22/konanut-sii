import { useMutation } from '@tanstack/react-query';

import { createDataAccessError, getErrorMessage } from '@/src/lib/error-utils';
import { queryClient } from '@/src/lib/query-client';
import { queryKeys } from '@/src/lib/query-keys';
import { supabase } from '@/src/lib/supabase';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import type {
  Database,
  Feedback,
  Settlement,
  SettlementRanking,
  Training,
} from '@/src/types/database';
import {
  calculateSettlementRanking,
  getCurrentRankingPeriod,
  type ComputedSettlementRanking,
} from '@/src/features/rankings/utils/ranking-calculator';
import {
  getRecentHalfYearPeriods,
  isHalfYearPeriod,
  sortHalfYearPeriodsDesc,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';

type RankingTrainingLink = {
  settlement_id: string;
  training: Pick<Training, 'id' | 'status' | 'title' | 'training_date' | 'training_type'> | null;
};

type SettlementRankingQueryRow = SettlementRanking & {
  settlement: Pick<Settlement, 'area' | 'id' | 'name' | 'regional_council'> | null;
};

type GlobalSettlementRankingRow =
  Database['public']['Functions']['list_global_settlement_rankings']['Returns'][number];

export type SettlementRankingListItem = {
  area: string;
  averageRating: number | null;
  calculatedAt: string;
  defenseCompleted: boolean;
  feedbackScore: number;
  finalScore: number;
  halfYearPeriod: HalfYearPeriod;
  rankingLevel: ComputedSettlementRanking['rankingLevel'];
  regionalCouncil: string | null;
  settlementId: string;
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
  defense_completed: boolean;
  feedback_score: number;
  final_score: number;
  half_year_period: string;
  ranking_level: string;
  regional_council: string | null;
  settlement_id: string;
  settlement_name: string;
  shooting_completed: boolean;
  training_score: number;
  area?: string | null;
  plaga_name?: string | null;
}) {
  return {
    area: item.plaga_name ?? item.area ?? '',
    averageRating: item.feedback_score ? Number((item.feedback_score / 10).toFixed(1)) : null,
    calculatedAt: item.calculated_at,
    defenseCompleted: item.defense_completed,
    feedbackScore: item.feedback_score,
    finalScore: item.final_score,
    halfYearPeriod: item.half_year_period as HalfYearPeriod,
    rankingLevel: item.ranking_level as ComputedSettlementRanking['rankingLevel'],
    regionalCouncil: item.regional_council,
    settlementId: item.settlement_id,
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
    { data: trainingLinks, error: trainingLinksError },
    { data: feedbacks, error: feedbacksError },
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select('id, name, area, regional_council')
      .order('name'),
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
    supabase.from('feedbacks').select('settlement_id, rating, created_at'),
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

  return ((settlements ?? []) as Array<
    Pick<Settlement, 'area' | 'id' | 'name' | 'regional_council'>
  >)
    .map((settlement) =>
      calculateSettlementRanking({
        feedbacks: (feedbacks ?? []) as Pick<
          Feedback,
          'created_at' | 'rating' | 'settlement_id'
        >[],
        period,
        settlement,
        trainings: ((trainingLinks ?? []) as RankingTrainingLink[]).filter(
          (link) => link.settlement_id === settlement.id
        ),
      })
    )
    .sort((left, right) => right.finalScore - left.finalScore);
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
        calculated_at,
        settlement:settlements!settlement_rankings_settlement_id_fkey (
          id,
          name,
          area,
          regional_council
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
        calculated_at: item.calculated_at,
        defense_completed: item.defense_completed,
        feedback_score: item.feedback_score,
        final_score: item.final_score,
        half_year_period: item.half_year_period,
        ranking_level: item.ranking_level,
        regional_council: item.settlement.regional_council,
        settlement_id: item.settlement_id,
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
      calculated_at: calculatedAt,
      defense_completed: item.defenseCompleted,
      feedback_score: item.feedbackScore,
      final_score: item.finalScore,
      half_year_period: item.halfYearPeriod,
      ranking_level: item.rankingLevel,
      settlement_id: item.settlementId,
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
