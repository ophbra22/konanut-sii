import {
  getHalfYearPeriod,
  getRecentHalfYearPeriods,
  isDateInHalfYear,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';
import type {
  Feedback,
  Settlement,
  Training,
  TrainingType,
} from '@/src/types/database';

export type SettlementTrainingLink = {
  settlement_id: string;
  training: Pick<Training, 'id' | 'status' | 'training_date' | 'training_type' | 'title'> | null;
};

export type RankingLevel = 'חריג' | 'דורש שיפור' | 'תקין' | 'טוב' | 'מצטיין';

export type ComputedSettlementRanking = {
  area: string;
  averageRating: number | null;
  defenseCompleted: boolean;
  feedbackCount: number;
  feedbackScore: number;
  finalScore: number;
  halfYearPeriod: HalfYearPeriod;
  rankingLevel: RankingLevel;
  regionalCouncil: string | null;
  settlementId: string;
  settlementName: string;
  shootingCompleted: boolean;
  trainingScore: number;
};

export function getRankingLevel(finalScore: number): RankingLevel {
  if (finalScore >= 90) {
    return 'מצטיין';
  }

  if (finalScore >= 75) {
    return 'טוב';
  }

  if (finalScore >= 60) {
    return 'תקין';
  }

  if (finalScore >= 40) {
    return 'דורש שיפור';
  }

  return 'חריג';
}

function isMatchingTrainingType(
  training: Pick<Training, 'training_type' | 'status'>,
  type: TrainingType
) {
  return training.training_type === type && training.status === 'הושלם';
}

export function calculateSettlementRanking(params: {
  feedbacks: Pick<Feedback, 'created_at' | 'rating' | 'settlement_id'>[];
  period: HalfYearPeriod;
  settlement: Pick<Settlement, 'area' | 'id' | 'name' | 'regional_council'>;
  trainings: SettlementTrainingLink[];
}): ComputedSettlementRanking {
  const trainingsInPeriod = params.trainings
    .map((item) => item.training)
    .filter((training): training is NonNullable<typeof training> => Boolean(training))
    .filter((training) => isDateInHalfYear(training.training_date, params.period));

  const shootingCompleted = trainingsInPeriod.some((training) =>
    isMatchingTrainingType(training, 'מטווח')
  );
  const defenseCompleted = trainingsInPeriod.some((training) =>
    isMatchingTrainingType(training, 'הגנת יישוב')
  );

  const trainingScore =
    (shootingCompleted ? 25 : 0) + (defenseCompleted ? 25 : 0);

  const feedbacksInPeriod = params.feedbacks.filter(
    (feedback) =>
      feedback.settlement_id === params.settlement.id &&
      isDateInHalfYear(feedback.created_at, params.period)
  );

  const averageRating = feedbacksInPeriod.length
    ? Number(
        (
          feedbacksInPeriod.reduce((sum, feedback) => sum + feedback.rating, 0) /
          feedbacksInPeriod.length
        ).toFixed(1)
      )
    : null;

  const feedbackScore = averageRating ? Math.round(averageRating * 10) : 0;
  const finalScore = trainingScore + feedbackScore;

  return {
    area: params.settlement.area,
    averageRating,
    defenseCompleted,
    feedbackCount: feedbacksInPeriod.length,
    feedbackScore,
    finalScore,
    halfYearPeriod: params.period,
    rankingLevel: getRankingLevel(finalScore),
    regionalCouncil: params.settlement.regional_council,
    settlementId: params.settlement.id,
    settlementName: params.settlement.name,
    shootingCompleted,
    trainingScore,
  };
}

export function getDefaultRankingPeriods() {
  return getRecentHalfYearPeriods();
}

export function getCurrentRankingPeriod() {
  return getHalfYearPeriod();
}
