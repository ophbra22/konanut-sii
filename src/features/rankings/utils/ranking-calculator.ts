import {
  getHalfYearPeriod,
  getPeriodDateRange,
  getRecentHalfYearPeriods,
  getYearDateRange,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';
import type {
  Feedback,
  Settlement,
  Training,
  TrainingSettlementAttendance,
  TrainingType,
} from '@/src/types/database';

export type SettlementTrainingLink = {
  settlement_id: string;
  training:
    | (Pick<
        Training,
        'id' | 'settlement_attendance' | 'status' | 'training_date' | 'training_type' | 'title'
      >)
    | null;
};

export type SettlementFeedbackLink = Pick<
  Feedback,
  'rating' | 'settlement_id' | 'training_id'
>;

export type RankingLevel = 'חריג' | 'דורש שיפור' | 'תקין' | 'טוב' | 'מצטיין';

export type ComputedSettlementRanking = {
  area: string;
  averageRating: number | null;
  baseScore: number;
  councilId: string | null;
  councilName: string | null;
  defenseCompleted: boolean;
  feedbackCount: number;
  feedbackScore: number;
  finalScore: number;
  halfYearPeriod: HalfYearPeriod;
  instructorFeedbackPoints: number;
  medianRangeParticipationPercent: number | null;
  rankingLevel: RankingLevel;
  regionalCouncil: string | null;
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

export function clampScore(score: number, min = 0, max = 100) {
  return Math.min(Math.max(score, min), max);
}

export function calculateSettlementBaseScore(params: {
  medianRangeParticipationPercent: number | null;
  settlementDefenseParticipationPercent: number | null;
}) {
  const passedMedianRange =
    params.medianRangeParticipationPercent !== null &&
    params.medianRangeParticipationPercent >= 70;
  const passedSettlementDefense =
    params.settlementDefenseParticipationPercent !== null &&
    params.settlementDefenseParticipationPercent >= 70;

  if (passedMedianRange && passedSettlementDefense) {
    return 70;
  }

  if (passedMedianRange || passedSettlementDefense) {
    return 35;
  }

  return 0;
}

export function calculateSettlementFinalScore(params: {
  instructorFeedbackPoints: number;
  medianRangeParticipationPercent: number | null;
  settlementDefenseParticipationPercent: number | null;
}) {
  const baseScore = calculateSettlementBaseScore({
    medianRangeParticipationPercent: params.medianRangeParticipationPercent,
    settlementDefenseParticipationPercent: params.settlementDefenseParticipationPercent,
  });

  if (baseScore === 0) {
    return 0;
  }

  if (baseScore < 70) {
    return baseScore;
  }

  return clampScore(baseScore + Math.max(params.instructorFeedbackPoints, 0));
}

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

function getOperationalTrainingCategory(trainingType: TrainingType): TrainingCategory {
  if (trainingType === 'מטווח') {
    return 'median_range';
  }

  if (trainingType === 'הגנת יישוב') {
    return 'settlement_defense';
  }

  return 'other';
}

function getYearStartFromPeriod(period: HalfYearPeriod) {
  const [year] = period.split('-') as [string, 'H1' | 'H2'];
  return `${year}-01-01`;
}

function isTrainingInHalfYear(trainingDate: string, period: HalfYearPeriod) {
  const { start, end } = getPeriodDateRange(period);

  return trainingDate >= start.format('YYYY-MM-DD') && trainingDate <= end.format('YYYY-MM-DD');
}

function isTrainingInPeriodYear(trainingDate: string, period: HalfYearPeriod) {
  const { start, end } = getYearDateRange(getYearStartFromPeriod(period));

  return trainingDate >= start.format('YYYY-MM-DD') && trainingDate <= end.format('YYYY-MM-DD');
}

function getSettlementAttendancePercentage(
  training: Pick<
    Training,
    'settlement_attendance' | 'status' | 'training_date' | 'training_type'
  >,
  settlementId: string
) {
  if (training.status !== 'הושלם') {
    return null;
  }

  const attendance = Array.isArray(training.settlement_attendance)
    ? (training.settlement_attendance as unknown as TrainingSettlementAttendance[])
    : [];

  return (
    attendance.find((item) => item.settlement_id === settlementId)?.participation_rate ?? null
  );
}

function getParticipationPercentages(params: {
  period: HalfYearPeriod;
  settlementId: string;
  trainings: SettlementTrainingLink[];
}) {
  let medianRangeParticipationPercent: number | null = null;
  let settlementDefenseParticipationPercent: number | null = null;
  let shootingCompleted = false;
  let defenseCompleted = false;

  params.trainings.forEach((link) => {
    const training = link.training;

    if (!training || training.status !== 'הושלם') {
      return;
    }

    const category = getOperationalTrainingCategory(training.training_type);

    if (category === 'median_range' && isTrainingInHalfYear(training.training_date, params.period)) {
      shootingCompleted = true;

      const participationRate = getSettlementAttendancePercentage(training, params.settlementId);
      if (participationRate === null) {
        return;
      }

      medianRangeParticipationPercent = Math.max(
        medianRangeParticipationPercent ?? 0,
        participationRate
      );
    }

    if (
      category === 'settlement_defense' &&
      isTrainingInPeriodYear(training.training_date, params.period)
    ) {
      defenseCompleted = true;

      const participationRate = getSettlementAttendancePercentage(training, params.settlementId);
      if (participationRate === null) {
        return;
      }

      settlementDefenseParticipationPercent = Math.max(
        settlementDefenseParticipationPercent ?? 0,
        participationRate
      );
    }
  });

  return {
    defenseCompleted,
    medianRangeParticipationPercent,
    shootingCompleted,
    settlementDefenseParticipationPercent,
  };
}

function getEligibleTrainingIdsInHalfYear(
  trainings: SettlementTrainingLink[],
  period: HalfYearPeriod
) {
  return new Set(
    trainings
      .map((item) => item.training)
      .filter((training): training is NonNullable<typeof training> => Boolean(training))
      .filter(
        (training) => training.status === 'הושלם' && isTrainingInHalfYear(training.training_date, period)
      )
      .map((training) => training.id)
  );
}

function calculateInstructorFeedbackSummary(params: {
  baseScore: number;
  feedbacks: SettlementFeedbackLink[];
  period: HalfYearPeriod;
  settlementId: string;
  trainings: SettlementTrainingLink[];
}) {
  if (params.baseScore === 0) {
    return {
      averageRating: null,
      feedbackCount: 0,
      instructorFeedbackPoints: 0,
    };
  }

  const eligibleTrainingIds = getEligibleTrainingIdsInHalfYear(params.trainings, params.period);
  const feedbacksInScope = params.feedbacks.filter(
    (feedback) =>
      feedback.settlement_id === params.settlementId &&
      eligibleTrainingIds.has(feedback.training_id)
  );

  const instructorFeedbackPoints = feedbacksInScope.reduce(
    (sum, feedback) => sum + Math.max(feedback.rating, 0),
    0
  );
  const averageRating = feedbacksInScope.length
    ? Number(
        (
          feedbacksInScope.reduce((sum, feedback) => sum + feedback.rating, 0) /
          feedbacksInScope.length
        ).toFixed(1)
      )
    : null;

  return {
    averageRating,
    feedbackCount: feedbacksInScope.length,
    instructorFeedbackPoints,
  };
}

export function calculateSettlementRanking(params: {
  feedbacks: SettlementFeedbackLink[];
  period: HalfYearPeriod;
  settlement: SettlementRankingSettlement;
  trainings: SettlementTrainingLink[];
}): ComputedSettlementRanking {
  const {
    defenseCompleted,
    medianRangeParticipationPercent,
    shootingCompleted,
    settlementDefenseParticipationPercent,
  } = getParticipationPercentages({
    period: params.period,
    settlementId: params.settlement.id,
    trainings: params.trainings.filter((link) => link.settlement_id === params.settlement.id),
  });

  const baseScore = calculateSettlementBaseScore({
    medianRangeParticipationPercent,
    settlementDefenseParticipationPercent,
  });
  const {
    averageRating,
    feedbackCount,
    instructorFeedbackPoints,
  } = calculateInstructorFeedbackSummary({
    baseScore,
    feedbacks: params.feedbacks,
    period: params.period,
    settlementId: params.settlement.id,
    trainings: params.trainings.filter((link) => link.settlement_id === params.settlement.id),
  });
  const finalScore = calculateSettlementFinalScore({
    instructorFeedbackPoints,
    medianRangeParticipationPercent,
    settlementDefenseParticipationPercent,
  });

  return {
    area: params.settlement.area,
    averageRating,
    baseScore,
    councilId: params.settlement.council_id,
    councilName: params.settlement.councilName ?? params.settlement.regional_council ?? null,
    defenseCompleted,
    feedbackCount,
    feedbackScore: instructorFeedbackPoints,
    finalScore,
    halfYearPeriod: params.period,
    instructorFeedbackPoints,
    medianRangeParticipationPercent,
    rankingLevel: getRankingLevel(finalScore),
    regionalCouncil: params.settlement.councilName ?? params.settlement.regional_council ?? null,
    settlementDefenseParticipationPercent,
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
