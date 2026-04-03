import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type { Settlement, Training, UserProfile } from '@/src/types/database';

type TrainingListQueryRow = Training & {
  instructor: Pick<UserProfile, 'id' | 'full_name'> | null;
  training_settlements: Array<{
    settlement: Pick<Settlement, 'id' | 'name' | 'area'> | null;
  }>;
};

export type TrainingListItem = Training & {
  instructor: Pick<UserProfile, 'id' | 'full_name'> | null;
  settlements: Array<Pick<Settlement, 'id' | 'name' | 'area'>>;
};

const trainingsListSelect = `
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
`;

export async function listTrainings(): Promise<TrainingListItem[]> {
  const { data, error } = await supabase
    .from('trainings')
    .select(trainingsListSelect)
    .order('training_date', { ascending: true })
    .order('training_time', { ascending: true, nullsFirst: false });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את רשימת האימונים');
  }

  const rows = (data ?? []) as unknown as TrainingListQueryRow[];

  return rows.map((row) => ({
    ...row,
    settlements: row.training_settlements
      .map((item) => item.settlement)
      .filter((settlement): settlement is NonNullable<typeof settlement> =>
        Boolean(settlement)
      ),
  }));
}
