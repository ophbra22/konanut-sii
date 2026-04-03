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

type SettlementSummary = Pick<Settlement, 'area' | 'id' | 'name'>;
type UserSummary = Pick<UserProfile, 'full_name' | 'id'>;

type TrainingListQueryRow = Training & {
  instructor: UserSummary | null;
  training_settlements: Array<{
    settlement: SettlementSummary | null;
  }>;
};

type TrainingDetailsQueryRow = Training & {
  feedbacks: Array<
    Pick<
      Feedback,
      'comment' | 'created_at' | 'id' | 'instructor_id' | 'rating' | 'settlement_id' | 'training_id'
    > & {
      instructor: UserSummary | null;
      settlement: SettlementSummary | null;
    }
  >;
  instructor: UserSummary | null;
  training_settlements: Array<{
    settlement: SettlementSummary | null;
  }>;
};

export type TrainingListItem = Training & {
  instructor: UserSummary | null;
  settlements: SettlementSummary[];
};

export type TrainingFeedbackItem = Pick<
  Feedback,
  'comment' | 'created_at' | 'id' | 'instructor_id' | 'rating' | 'settlement_id' | 'training_id'
> & {
  instructor: UserSummary | null;
  settlement: SettlementSummary | null;
};

export type TrainingDetails = Training & {
  averageFeedbackRating: number | null;
  feedbackCount: number;
  feedbacks: TrainingFeedbackItem[];
  instructor: UserSummary | null;
  missingFeedbackSettlements: SettlementSummary[];
  settlements: SettlementSummary[];
};

type SaveTrainingFeedbackParams = {
  comment: string | null;
  feedbackId?: string;
  instructorId: string | null;
  rating: number;
  settlementId: string;
  trainingId: string;
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

function mapSettlements(
  trainingSettlements: Array<{
    settlement: SettlementSummary | null;
  }>
) {
  return trainingSettlements
    .map((item) => item.settlement)
    .filter((settlement): settlement is NonNullable<typeof settlement> =>
      Boolean(settlement)
    );
}

function normalizeComment(comment: string | null) {
  const normalized = comment?.trim();
  return normalized ? normalized : null;
}

function buildTrainingDetails(data: TrainingDetailsQueryRow): TrainingDetails {
  const settlements = mapSettlements(data.training_settlements ?? []);
  const feedbacks = [...(data.feedbacks ?? [])].sort((left, right) =>
    right.created_at.localeCompare(left.created_at)
  );
  const feedbackSettlementIds = new Set(
    feedbacks.map((feedback) => feedback.settlement?.id ?? feedback.settlement_id)
  );
  const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);

  return {
    ...data,
    averageFeedbackRating: feedbacks.length
      ? Number((totalRating / feedbacks.length).toFixed(1))
      : null,
    feedbackCount: feedbacks.length,
    feedbacks,
    missingFeedbackSettlements: settlements.filter(
      (settlement) => !feedbackSettlementIds.has(settlement.id)
    ),
    settlements,
  };
}

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
    settlements: mapSettlements(row.training_settlements ?? []),
  }));
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
          training_id,
          settlement_id,
          instructor_id,
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

  return buildTrainingDetails(data as unknown as TrainingDetailsQueryRow);
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

async function ensureSettlementLinkedToTraining(
  trainingId: string,
  settlementId: string
) {
  const { data, error } = await supabase
    .from('training_settlements')
    .select('id')
    .eq('training_id', trainingId)
    .eq('settlement_id', settlementId)
    .maybeSingle();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לאמת את שיוך היישוב לאימון');
  }

  if (!data) {
    throw new Error('ניתן להזין משוב רק עבור יישוב שמשויך לאימון הנוכחי');
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

export async function saveTrainingFeedback(params: SaveTrainingFeedbackParams) {
  await ensureSettlementLinkedToTraining(params.trainingId, params.settlementId);

  if (params.feedbackId) {
    const { error } = await supabase
      .from('feedbacks')
      .update({
        comment: normalizeComment(params.comment),
        instructor_id: params.instructorId,
        rating: params.rating,
        settlement_id: params.settlementId,
      })
      .eq('id', params.feedbackId);

    if (error) {
      throw createDataAccessError(error, 'לא ניתן לעדכן את המשוב');
    }

    return getTrainingDetails(params.trainingId);
  }

  const { data: existingFeedback, error: existingFeedbackError } = await supabase
    .from('feedbacks')
    .select('id')
    .eq('training_id', params.trainingId)
    .eq('settlement_id', params.settlementId)
    .maybeSingle();

  if (existingFeedbackError) {
    throw createDataAccessError(existingFeedbackError, 'לא ניתן לבדוק אם קיים משוב קודם');
  }

  if (existingFeedback) {
    const { error } = await supabase
      .from('feedbacks')
      .update({
        comment: normalizeComment(params.comment),
        instructor_id: params.instructorId,
        rating: params.rating,
      })
      .eq('id', existingFeedback.id);

    if (error) {
      throw createDataAccessError(error, 'לא ניתן לעדכן את המשוב הקיים');
    }

    return getTrainingDetails(params.trainingId);
  }

  const { error } = await supabase.from('feedbacks').insert({
    comment: normalizeComment(params.comment),
    instructor_id: params.instructorId,
    rating: params.rating,
    settlement_id: params.settlementId,
    training_id: params.trainingId,
  });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לשמור משוב חדש');
  }

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

export async function deleteTrainingFeedback(params: {
  feedbackId: string;
  trainingId: string;
}) {
  const { error } = await supabase.from('feedbacks').delete().eq('id', params.feedbackId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן למחוק את המשוב');
  }

  return getTrainingDetails(params.trainingId);
}
