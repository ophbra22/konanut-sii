import {
  getHalfYearPeriod,
  getPeriodDateRange,
  getRecentHalfYearPeriods,
  getYearDateRange,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';
import type { Feedback, Settlement, Training, TrainingType } from '@/src/types/database';

export type AnnualRankingPeriod = `${number}-YEAR`;
export type RankingPeriod = HalfYearPeriod | AnnualRankingPeriod;

export type SettlementTrainingLink = {
  settlement_id: string;
  training:
    | Pick<Training, 'id' | 'status' | 'training_date' | 'training_type' | 'title'>
    | null;
};

export type SettlementFeedbackLink = Pick<
  Feedback,
  'rating' | 'settlement_id' | 'training_id'
> & {
  is_training_level?: boolean;
};

export type RankingLevel = 'פער' | 'במעקב' | 'כשיר' | 'כשיר מאוד';

export type RankingTrainingEvidence = {
  date: string;
  feedbackRating: number | null;
  id: string;
  title: string;
  type: TrainingType;
};

export type ComputedSettlementRanking = {
  area: string;
  averageRating: number | null;
  baseScore: number;
  councilId: string | null;
  councilName: string | null;
  defenseCompleted: boolean;
  defenseScore: number;
  feedbackCount: number;
  feedbackScore: number;
  feedbackScale: 5;
  feedbackTrainings: RankingTrainingEvidence[];
  finalScore: number;
  halfYearPeriod: RankingPeriod;
  instructorFeedbackPoints: number;
  lastDefenseTrainingDate: string | null;
  lastRangeTrainingDate: string | null;
  medianRangeParticipationPercent: number | null;
  rankingLevel: RankingLevel;
  rangeScore: number;
  rawScore: number;
  regionalCouncil: string | null;
  scoreCap: number | null;
  selectedDefenseTraining: RankingTrainingEvidence | null;
  selectedRangeTraining: RankingTrainingEvidence | null;
  settlementDefenseParticipationPercent: number | null;
  settlementId: string;
  settlementName: string;
  shootingCompleted: boolean;
  trainingScore: number;
};

type SettlementRankingSettlement = Pick<
  Settlement,
  'area' | 'council_id' | 'id' | 'name' | 'regional_council'
> & {
  councilName?: string | null;
};

type TrainingCategory = 'median_range' | 'other' | 'settlement_defense';

const FEEDBACK_SCALE = 5;

export function clampScore(score: number, min = 0, max = 100) {
  return Math.min(Math.max(score, min), max);
}

export function getAnnualRankingPeriod(referenceDate: string | Date = new Date()) {
  return `${new Date(referenceDate).getFullYear()}-YEAR` as AnnualRankingPeriod;
}

export function isAnnualRankingPeriod(period: RankingPeriod): period is AnnualRankingPeriod {
  return period.endsWith('-YEAR');
}

export function getRankingPeriodYear(period: RankingPeriod) {
  return Number(period.split('-')[0]);
}

export function getRankingPeriodDateRange(period: RankingPeriod) {
  if (isAnnualRankingPeriod(period)) {
    return getYearDateRange(`${getRankingPeriodYear(period)}-01-01`);
  }

  return getPeriodDateRange(period);
}

export function getRankingPeriodLabel(period: RankingPeriod) {
  const year = getRankingPeriodYear(period);

  if (isAnnualRankingPeriod(period)) {
    return `שנתי ${year}`;
  }

  return period.endsWith('H1') ? `חציון א׳ ${year}` : `חציון ב׳ ${year}`;
}

function getYearPeriodDateRange(period: RankingPeriod) {
  return getYearDateRange(`${getRankingPeriodYear(period)}-01-01`);
}

function isDateInRange(date: string, params: { end: string; start: string }) {
  return date >= params.start && date <= params.end;
}

function toStringRange(period: RankingPeriod) {
  const { start, end } = getRankingPeriodDateRange(period);

  return {
    end: end.format('YYYY-MM-DD'),
    start: start.format('YYYY-MM-DD'),
  };
}

function toStringYearRange(period: RankingPeriod) {
  const { start, end } = getYearPeriodDateRange(period);

  return {
    end: end.format('YYYY-MM-DD'),
    start: start.format('YYYY-MM-DD'),
  };
}

function getOperationalTrainingCategory(trainingType: TrainingType): TrainingCategory {
  if (trainingType === 'מטווח') {
    return 'median_range';
  }

  if (trainingType === 'הגנת יישוב') {
    return 'settlement_defense';
  }

  return 'other';
}

function getFeedbackWeight(trainingType: TrainingType) {
  const category = getOperationalTrainingCategory(trainingType);

  if (category === 'median_range' || category === 'settlement_defense') {
    return 1.2;
  }

  return 0.8;
}

function isCompletedTraining(
  training: SettlementTrainingLink['training']
): training is NonNullable<SettlementTrainingLink['training']> {
  return Boolean(training && training.status === 'הושלם');
}

function getTrainingEvidence(params: {
  feedbackRating: number | null;
  training: NonNullable<SettlementTrainingLink['training']>;
}): RankingTrainingEvidence {
  return {
    date: params.training.training_date,
    feedbackRating: params.feedbackRating,
    id: params.training.id,
    title: params.training.title,
    type: params.training.training_type,
  };
}

function getFeedbacksByTraining(params: {
  feedbacks: SettlementFeedbackLink[];
  settlementId: string;
}) {
  const feedbacksByTraining = new Map<string, SettlementFeedbackLink[]>();

  params.feedbacks.forEach((feedback) => {
    if (!feedback.is_training_level && feedback.settlement_id !== params.settlementId) {
      return;
    }

    const current = feedbacksByTraining.get(feedback.training_id) ?? [];
    current.push(feedback);
    feedbacksByTraining.set(feedback.training_id, current);
  });

  return feedbacksByTraining;
}

function getAverageTrainingFeedback(
  trainingId: string,
  feedbacksByTraining: Map<string, SettlementFeedbackLink[]>
) {
  const feedbacks = feedbacksByTraining.get(trainingId) ?? [];

  if (!feedbacks.length) {
    return null;
  }

  return feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length;
}

function getLatestTraining(
  trainings: NonNullable<SettlementTrainingLink['training']>[]
) {
  return [...trainings].sort((left, right) => {
    if (right.training_date !== left.training_date) {
      return right.training_date.localeCompare(left.training_date);
    }

    return right.title.localeCompare(left.title, 'he');
  })[0] ?? null;
}

function getRequiredTrainingSummary(params: {
  feedbacksByTraining: Map<string, SettlementFeedbackLink[]>;
  period: RankingPeriod;
  trainings: SettlementTrainingLink[];
}) {
  const selectedRange = toStringRange(params.period);
  const selectedYear = toStringYearRange(params.period);
  const completedTrainings = params.trainings
    .map((link) => link.training)
    .filter(isCompletedTraining);

  const rangeTrainings = completedTrainings.filter(
    (training) =>
      getOperationalTrainingCategory(training.training_type) === 'median_range' &&
      isDateInRange(training.training_date, selectedRange)
  );
  const defenseTrainings = completedTrainings.filter(
    (training) =>
      getOperationalTrainingCategory(training.training_type) === 'settlement_defense' &&
      isDateInRange(training.training_date, selectedYear)
  );

  const selectedRangeTraining = getLatestTraining(rangeTrainings);
  const selectedDefenseTraining = getLatestTraining(defenseTrainings);

  return {
    defenseCompleted: Boolean(selectedDefenseTraining),
    lastDefenseTrainingDate: selectedDefenseTraining?.training_date ?? null,
    lastRangeTrainingDate: selectedRangeTraining?.training_date ?? null,
    selectedDefenseTraining: selectedDefenseTraining
      ? getTrainingEvidence({
          feedbackRating: getAverageTrainingFeedback(
            selectedDefenseTraining.id,
            params.feedbacksByTraining
          ),
          training: selectedDefenseTraining,
        })
      : null,
    selectedRangeTraining: selectedRangeTraining
      ? getTrainingEvidence({
          feedbackRating: getAverageTrainingFeedback(
            selectedRangeTraining.id,
            params.feedbacksByTraining
          ),
          training: selectedRangeTraining,
        })
      : null,
    shootingCompleted: Boolean(selectedRangeTraining),
  };
}

function calculateInstructorFeedbackSummary(params: {
  feedbacksByTraining: Map<string, SettlementFeedbackLink[]>;
  period: RankingPeriod;
  trainings: SettlementTrainingLink[];
}) {
  const selectedRange = toStringRange(params.period);
  const completedTrainingsInScope = params.trainings
    .map((link) => link.training)
    .filter(isCompletedTraining)
    .filter((training) => isDateInRange(training.training_date, selectedRange));

  const feedbackTrainings: RankingTrainingEvidence[] = [];
  let weightedRatingSum = 0;
  let weightSum = 0;
  let feedbackCount = 0;

  completedTrainingsInScope.forEach((training) => {
    const feedbackRating = getAverageTrainingFeedback(training.id, params.feedbacksByTraining);

    if (feedbackRating === null) {
      return;
    }

    const weight = getFeedbackWeight(training.training_type);
    weightedRatingSum += feedbackRating * weight;
    weightSum += weight;
    feedbackCount += params.feedbacksByTraining.get(training.id)?.length ?? 0;
    feedbackTrainings.push(getTrainingEvidence({ feedbackRating, training }));
  });

  const averageRating = weightSum > 0 ? weightedRatingSum / weightSum : null;
  const feedbackScore =
    averageRating === null ? 0 : clampScore((averageRating / FEEDBACK_SCALE) * 30, 0, 30);

  return {
    averageRating: averageRating === null ? null : Number(averageRating.toFixed(1)),
    feedbackCount,
    feedbackScore: Number(feedbackScore.toFixed(1)),
    feedbackTrainings: feedbackTrainings.sort((left, right) =>
      right.date.localeCompare(left.date)
    ),
  };
}

export function calculateSettlementBaseScore(params: {
  defenseCompleted: boolean;
  shootingCompleted: boolean;
}) {
  return (params.shootingCompleted ? 40 : 0) + (params.defenseCompleted ? 30 : 0);
}

export function calculateSettlementFinalScore(params: {
  defenseCompleted: boolean;
  feedbackScore: number;
  shootingCompleted: boolean;
}) {
  const rangeScore = params.shootingCompleted ? 40 : 0;
  const defenseScore = params.defenseCompleted ? 30 : 0;
  const rawScore = rangeScore + defenseScore + params.feedbackScore;
  let scoreCap: number | null = null;

  if (!params.shootingCompleted && !params.defenseCompleted) {
    scoreCap = 40;
  } else if (!params.shootingCompleted) {
    scoreCap = 55;
  } else if (!params.defenseCompleted) {
    scoreCap = 70;
  }

  return {
    defenseScore,
    finalScore: Math.round(scoreCap === null ? rawScore : Math.min(rawScore, scoreCap)),
    rangeScore,
    rawScore: Number(rawScore.toFixed(1)),
    scoreCap,
  };
}

export function getRankingLevel(finalScore: number): RankingLevel {
  if (finalScore >= 85) {
    return 'כשיר מאוד';
  }

  if (finalScore >= 70) {
    return 'כשיר';
  }

  if (finalScore >= 55) {
    return 'במעקב';
  }

  return 'פער';
}

export function compareSettlementRankings(
  left: Pick<
    ComputedSettlementRanking,
    'averageRating' | 'defenseCompleted' | 'finalScore' | 'settlementName' | 'shootingCompleted'
  >,
  right: Pick<
    ComputedSettlementRanking,
    'averageRating' | 'defenseCompleted' | 'finalScore' | 'settlementName' | 'shootingCompleted'
  >
) {
  if (right.finalScore !== left.finalScore) {
    return right.finalScore - left.finalScore;
  }

  if (right.shootingCompleted !== left.shootingCompleted) {
    return Number(right.shootingCompleted) - Number(left.shootingCompleted);
  }

  if (right.defenseCompleted !== left.defenseCompleted) {
    return Number(right.defenseCompleted) - Number(left.defenseCompleted);
  }

  const leftAverage = left.averageRating ?? 0;
  const rightAverage = right.averageRating ?? 0;

  if (rightAverage !== leftAverage) {
    return rightAverage - leftAverage;
  }

  return left.settlementName.localeCompare(right.settlementName, 'he');
}

export function calculateSettlementRanking(params: {
  feedbacks: SettlementFeedbackLink[];
  period: RankingPeriod;
  settlement: SettlementRankingSettlement;
  trainings: SettlementTrainingLink[];
}): ComputedSettlementRanking {
  const settlementTrainings = params.trainings.filter(
    (link) => link.settlement_id === params.settlement.id
  );
  const feedbacksByTraining = getFeedbacksByTraining({
    feedbacks: params.feedbacks,
    settlementId: params.settlement.id,
  });
  const {
    defenseCompleted,
    lastDefenseTrainingDate,
    lastRangeTrainingDate,
    selectedDefenseTraining,
    selectedRangeTraining,
    shootingCompleted,
  } = getRequiredTrainingSummary({
    feedbacksByTraining,
    period: params.period,
    trainings: settlementTrainings,
  });
  const {
    averageRating,
    feedbackCount,
    feedbackScore,
    feedbackTrainings,
  } = calculateInstructorFeedbackSummary({
    feedbacksByTraining,
    period: params.period,
    trainings: settlementTrainings,
  });
  const {
    defenseScore,
    finalScore,
    rangeScore,
    rawScore,
    scoreCap,
  } = calculateSettlementFinalScore({
    defenseCompleted,
    feedbackScore,
    shootingCompleted,
  });
  const baseScore = calculateSettlementBaseScore({ defenseCompleted, shootingCompleted });

  return {
    area: params.settlement.area,
    averageRating,
    baseScore,
    councilId: params.settlement.council_id,
    councilName: params.settlement.councilName ?? params.settlement.regional_council ?? null,
    defenseCompleted,
    defenseScore,
    feedbackCount,
    feedbackScale: FEEDBACK_SCALE,
    feedbackScore,
    feedbackTrainings,
    finalScore,
    halfYearPeriod: params.period,
    instructorFeedbackPoints: feedbackScore,
    lastDefenseTrainingDate,
    lastRangeTrainingDate,
    medianRangeParticipationPercent: null,
    rankingLevel: getRankingLevel(finalScore),
    rangeScore,
    rawScore,
    regionalCouncil: params.settlement.councilName ?? params.settlement.regional_council ?? null,
    scoreCap,
    selectedDefenseTraining,
    selectedRangeTraining,
    settlementDefenseParticipationPercent: null,
    settlementId: params.settlement.id,
    settlementName: params.settlement.name,
    shootingCompleted,
    trainingScore: baseScore,
  };
}

export function getDefaultRankingPeriods() {
  return getRecentHalfYearPeriods();
}

export function getCurrentRankingPeriod() {
  return getHalfYearPeriod();
}
