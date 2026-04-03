import dayjs from 'dayjs';

import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type { Settlement, Training, UserProfile } from '@/src/types/database';

type CalendarTrainingQueryRow = Training & {
  instructor: Pick<UserProfile, 'full_name' | 'id'> | null;
  training_settlements: Array<{
    settlement: Pick<Settlement, 'area' | 'id' | 'name'> | null;
  }>;
};

export type CalendarTrainingItem = Training & {
  instructor: Pick<UserProfile, 'full_name' | 'id'> | null;
  settlements: Array<Pick<Settlement, 'area' | 'id' | 'name'>>;
};

export type CalendarOverview = {
  areas: string[];
  instructors: Array<Pick<UserProfile, 'full_name' | 'id'>>;
  settlements: Array<Pick<Settlement, 'area' | 'id' | 'name'>>;
  trainings: CalendarTrainingItem[];
};

export async function getCalendarOverview(monthKey: string): Promise<CalendarOverview> {
  const monthDate = dayjs(`${monthKey}-01`);
  const start = monthDate.startOf('month').format('YYYY-MM-DD');
  const end = monthDate.endOf('month').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('trainings')
    .select(
      `
        id,
        title,
        training_type,
        location,
        instructor_id,
        training_date,
        training_time,
        status,
        notes,
        created_at,
        instructor:users_profile!trainings_instructor_id_fkey (
          id,
          full_name
        ),
        training_settlements (
          settlement:settlements (
            id,
            name,
            area
          )
        )
      `
    )
    .gte('training_date', start)
    .lte('training_date', end)
    .order('training_date', { ascending: true })
    .order('training_time', { ascending: true, nullsFirst: false });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את היומן המבצעי');
  }

  const rows = (data ?? []) as unknown as CalendarTrainingQueryRow[];
  const settlementsMap = new Map<string, Pick<Settlement, 'area' | 'id' | 'name'>>();
  const instructorsMap = new Map<string, Pick<UserProfile, 'full_name' | 'id'>>();

  const trainings = rows.map((row) => {
    const settlements = row.training_settlements
      .map((item) => item.settlement)
      .filter((settlement): settlement is NonNullable<typeof settlement> =>
        Boolean(settlement)
      );

    settlements.forEach((settlement) => {
      settlementsMap.set(settlement.id, settlement);
    });

    if (row.instructor) {
      instructorsMap.set(row.instructor.id, row.instructor);
    }

    return {
      ...row,
      training_settlements: undefined,
      settlements,
    };
  }) as CalendarTrainingItem[];

  return {
    areas: Array.from(
      new Set(
        Array.from(settlementsMap.values())
          .map((settlement) => settlement.area.trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, 'he')),
    instructors: Array.from(instructorsMap.values()).sort((left, right) =>
      left.full_name.localeCompare(right.full_name, 'he')
    ),
    settlements: Array.from(settlementsMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name, 'he')
    ),
    trainings,
  };
}
