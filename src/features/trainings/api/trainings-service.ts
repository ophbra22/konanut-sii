import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type {
  Feedback,
  Settlement,
  TablesInsert,
  TablesUpdate,
  Training,
  UserProfile,
} from '@/src/types/database';

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

export type TrainingFeedbackItem = Pick<
  Feedback,
  'comment' | 'created_at' | 'id' | 'rating'
> & {
  instructor: Pick<UserProfile, 'id' | 'full_name'> | null;
  settlement: Pick<Settlement, 'id' | 'name' | 'area'> | null;
};

export type TrainingDetails = Training & {
  feedbacks: TrainingFeedbackItem[];
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
    training_settlements: undefined,
    settlements: row.training_settlements
      .map((item) => item.settlement)
      .filter((settlement): settlement is NonNullable<typeof settlement> =>
        Boolean(settlement)
      ),
  })) as TrainingListItem[];
}

export async function getTrainingDetails(
  trainingId: string
): Promise<TrainingDetails> {
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
        ),
        feedbacks (
          id,
          rating,
          comment,
          created_at,
          instructor:users_profile!feedbacks_instructor_id_fkey (
            id,
            full_name
          ),
          settlement:settlements!feedbacks_settlement_id_fkey (
            id,
            name,
            area
          )
        )
      `
    )
    .eq('id', trainingId)
    .maybeSingle();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את פרטי האימון');
  }

  if (!data) {
    throw new Error('האימון המבוקש לא נמצא');
  }

  const typedData = data as unknown as Training & {
    feedbacks: TrainingFeedbackItem[];
    instructor: Pick<UserProfile, 'id' | 'full_name'> | null;
    training_settlements: Array<{
      settlement: Pick<Settlement, 'id' | 'name' | 'area'> | null;
    }>;
  };

  return {
    ...typedData,
    feedbacks: typedData.feedbacks ?? [],
    settlements: (typedData.training_settlements ?? [])
      .map((item) => item.settlement)
      .filter((settlement): settlement is NonNullable<typeof settlement> =>
        Boolean(settlement)
      ),
  };
}

async function replaceTrainingSettlements(
  trainingId: string,
  settlementIds: string[]
) {
  const { error: deleteError } = await supabase
    .from('training_settlements')
    .delete()
    .eq('training_id', trainingId);

  if (deleteError) {
    throw createDataAccessError(deleteError, 'לא ניתן לעדכן את שיוכי היישובים');
  }

  if (!settlementIds.length) {
    return;
  }

  const { error: insertError } = await supabase.from('training_settlements').insert(
    settlementIds.map((settlementId) => ({
      settlement_id: settlementId,
      training_id: trainingId,
    }))
  );

  if (insertError) {
    throw createDataAccessError(insertError, 'לא ניתן לשמור את שיוכי היישובים');
  }
}

export async function createTraining(params: {
  settlementIds: string[];
  values: TablesInsert<'trainings'>;
}) {
  const { data, error } = await supabase
    .from('trainings')
    .insert(params.values)
    .select('id')
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן ליצור אימון חדש');
  }

  try {
    await replaceTrainingSettlements(data.id, params.settlementIds);
  } catch (linkError) {
    await supabase.from('trainings').delete().eq('id', data.id);
    throw linkError;
  }

  return getTrainingDetails(data.id);
}

export async function updateTraining(params: {
  settlementIds: string[];
  trainingId: string;
  values: TablesUpdate<'trainings'>;
}) {
  const { error } = await supabase
    .from('trainings')
    .update(params.values)
    .eq('id', params.trainingId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לעדכן את פרטי האימון');
  }

  await replaceTrainingSettlements(params.trainingId, params.settlementIds);

  return getTrainingDetails(params.trainingId);
}

export async function updateTrainingStatus(
  trainingId: string,
  status: Training['status']
) {
  const { data, error } = await supabase
    .from('trainings')
    .update({ status })
    .eq('id', trainingId)
    .select('*')
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לעדכן את סטטוס האימון');
  }

  return data;
}

export async function deleteTraining(trainingId: string) {
  const { error } = await supabase.from('trainings').delete().eq('id', trainingId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן למחוק את האימון');
  }
}
