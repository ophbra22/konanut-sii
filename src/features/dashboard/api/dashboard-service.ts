import dayjs from 'dayjs';

import {
  isCouncilScopedRole,
  isSettlementScopedRole,
} from '@/src/features/auth/lib/permissions';
import { createDataAccessError } from '@/src/lib/error-utils';
import {
  getCurrentHalfYearPeriod,
  getHalfYearPeriod,
  getMonthDateRange,
  getWeekDateRange,
  getYearDateRange,
  isDateInHalfYear,
  type HalfYearPeriod,
} from '@/src/lib/date-utils';
import { supabase } from '@/src/lib/supabase';
import type {
  Alert,
  AuthProfile,
  Settlement,
  SettlementRanking,
  Training,
  UserRole,
} from '@/src/types/database';

export type DashboardAlertItem = Pick<
  Alert,
  'created_at' | 'description' | 'id' | 'severity' | 'status' | 'title' | 'type'
> & {
  related_settlement_name?: string | null;
};

export type DashboardUpcomingTraining = Pick<
  Training,
  | 'id'
  | 'location'
  | 'status'
  | 'title'
  | 'training_date'
  | 'training_time'
  | 'training_type'
> & {
  settlements: string[];
};

type DashboardScope = Pick<
  AuthProfile,
  'linkedRegionalCouncils' | 'linkedSettlementIds'
> & {
  role: UserRole | null;
};

type ScopedSettlement = Pick<Settlement, 'id' | 'regional_council'>;

export type DashboardOverview = {
  alertsSummary: DashboardAlertItem[];
  averageSettlementScore: number | null;
  currentRankingPeriod: HalfYearPeriod;
  missingDefenseSettlementsCount: number;
  missingShootingSettlementsCount: number;
  monthlyTrainingsCount: number;
  systemStatus: 'מבצעי';
  weeklyTrainingsCount: number;
  upcomingTrainings: DashboardUpcomingTraining[];
};

function normalizeRegionalCouncil(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function getScopedSettlements(
  settlements: ScopedSettlement[],
  scope: DashboardScope
) {
  if (isSettlementScopedRole(scope.role)) {
    const linkedSettlementIds = new Set(scope.linkedSettlementIds);

    return settlements.filter((settlement) => linkedSettlementIds.has(settlement.id));
  }

  if (isCouncilScopedRole(scope.role)) {
    const linkedRegionalCouncils = new Set(
      scope.linkedRegionalCouncils.map((regionalCouncil) =>
        normalizeRegionalCouncil(regionalCouncil)
      )
    );

    return settlements.filter((settlement) =>
      linkedRegionalCouncils.has(normalizeRegionalCouncil(settlement.regional_council))
    );
  }

  return settlements;
}

export async function getDashboardOverview(
  scope: DashboardScope
): Promise<DashboardOverview> {
  const monthRange = getMonthDateRange();
  const weekRange = getWeekDateRange();
  const today = dayjs().format('YYYY-MM-DD');
  const currentHalfYear = getCurrentHalfYearPeriod();
  const currentRankingPeriod = getHalfYearPeriod();
  const currentYearRange = getYearDateRange();

  const [
    { data: settlements, error: settlementsError },
    { count: weeklyTrainingsCount, error: weeklyTrainingsError },
    { count: monthlyTrainingsCount, error: monthlyTrainingsError },
    { data: rankingRows, error: rankingsError },
    { data: alerts, error: alertsError },
    { data: upcomingTrainings, error: upcomingTrainingsError },
    { data: complianceTrainings, error: complianceTrainingsError },
  ] = await Promise.all([
    supabase
      .from('settlements')
      .select('id, regional_council'),
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
      .limit(3),
    supabase
      .from('trainings')
      .select('id, title, training_type, training_date, training_time, status, location')
      .neq('status', 'בוטל')
      .gte('training_date', today)
      .order('training_date', { ascending: true })
      .order('training_time', { ascending: true, nullsFirst: false })
      .limit(3),
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

  if (complianceTrainingsError) {
    throw createDataAccessError(
      complianceTrainingsError,
      'לא ניתן לטעון את נתוני עמידת היישובים בדרישות האימון'
    );
  }

  const { data: upcomingTrainingLinks, error: upcomingTrainingLinksError } =
    (upcomingTrainings ?? []).length
      ? await supabase
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
      : { data: [], error: null };

  if (upcomingTrainingLinksError) {
    throw createDataAccessError(upcomingTrainingLinksError, 'לא ניתן לטעון את שיוכי האימונים הקרובים');
  }

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

  const scopedSettlements = getScopedSettlements(
    ((settlements ?? []) as ScopedSettlement[]),
    scope
  );
  const scopedSettlementIds = new Set(scopedSettlements.map((settlement) => settlement.id));
  const settlementsWithShootingCompleted = new Set<string>();
  const settlementsWithDefenseCompleted = new Set<string>();

  (
    (complianceTrainings ?? []) as Array<
      Pick<Training, 'training_date' | 'training_type'> & {
        training_settlements: Array<{ settlement_id: string }>;
      }
    >
  ).forEach((training) => {
    training.training_settlements.forEach((link) => {
      if (!scopedSettlementIds.has(link.settlement_id)) {
        return;
      }

      if (
        training.training_type === 'מטווח' &&
        isDateInHalfYear(training.training_date, currentHalfYear)
      ) {
        settlementsWithShootingCompleted.add(link.settlement_id);
      }

      if (training.training_type === 'הגנת יישוב') {
        settlementsWithDefenseCompleted.add(link.settlement_id);
      }
    });
  });

  const missingShootingSettlementsCount = scopedSettlements.filter(
    (settlement) => !settlementsWithShootingCompleted.has(settlement.id)
  ).length;
  const missingDefenseSettlementsCount = scopedSettlements.filter(
    (settlement) => !settlementsWithDefenseCompleted.has(settlement.id)
  ).length;

  return {
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
    missingDefenseSettlementsCount,
    missingShootingSettlementsCount,
    monthlyTrainingsCount: monthlyTrainingsCount ?? 0,
    systemStatus: 'מבצעי',
    upcomingTrainings: (upcomingTrainings ?? []).map((training) => ({
      ...training,
      settlements: settlementLinksByTraining.get(training.id) ?? [],
    })),
    weeklyTrainingsCount: weeklyTrainingsCount ?? 0,
  };
}
