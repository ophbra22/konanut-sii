import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type {
  ProfessionalContent,
  TablesInsert,
  TablesUpdate,
  UserProfile,
} from '@/src/types/database';

type ContentCreatorSummary = Pick<UserProfile, 'full_name' | 'id'>;

type ProfessionalContentQueryRow = ProfessionalContent & {
  created_by_profile: ContentCreatorSummary | null;
};

export type ProfessionalContentListItem = ProfessionalContent & {
  createdByProfile: ContentCreatorSummary | null;
};

const professionalContentSelect = `
  id,
  title,
  description,
  content_type,
  topic,
  url,
  thumbnail_url,
  is_active,
  created_at,
  created_by,
  created_by_profile:users_profile!professional_content_created_by_fkey (
    id,
    full_name
  )
`;

function mapProfessionalContent(
  row: ProfessionalContentQueryRow
): ProfessionalContentListItem {
  return {
    ...row,
    createdByProfile: row.created_by_profile ?? null,
  };
}

export async function listProfessionalContent(options?: {
  includeInactive?: boolean;
}): Promise<ProfessionalContentListItem[]> {
  const includeInactive = options?.includeInactive ?? false;
  let query = supabase
    .from('professional_content')
    .select(professionalContentSelect)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
    .order('title', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את התוכן המקצועי');
  }

  return ((data ?? []) as ProfessionalContentQueryRow[]).map(mapProfessionalContent);
}

export async function getProfessionalContentDetails(
  contentId: string,
  options?: {
    includeInactive?: boolean;
  }
): Promise<ProfessionalContentListItem> {
  const includeInactive = options?.includeInactive ?? false;
  let query = supabase
    .from('professional_content')
    .select(professionalContentSelect)
    .eq('id', contentId);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את פרטי התוכן המקצועי');
  }

  if (!data) {
    throw new Error('פריט התוכן המבוקש אינו זמין או שאין הרשאה לצפייה בו');
  }

  return mapProfessionalContent(data as ProfessionalContentQueryRow);
}

export async function createProfessionalContent(
  values: TablesInsert<'professional_content'>
): Promise<ProfessionalContentListItem> {
  const { data, error } = await supabase
    .from('professional_content')
    .insert(values)
    .select(professionalContentSelect)
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן ליצור את פריט התוכן');
  }

  return mapProfessionalContent(data as ProfessionalContentQueryRow);
}

export async function updateProfessionalContent(
  contentId: string,
  values: TablesUpdate<'professional_content'>
): Promise<ProfessionalContentListItem> {
  const { data, error } = await supabase
    .from('professional_content')
    .update(values)
    .eq('id', contentId)
    .select(professionalContentSelect)
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לעדכן את פריט התוכן');
  }

  return mapProfessionalContent(data as ProfessionalContentQueryRow);
}

export async function deleteProfessionalContent(contentId: string) {
  const { error } = await supabase
    .from('professional_content')
    .delete()
    .eq('id', contentId);

  if (error) {
    throw createDataAccessError(error, 'לא ניתן למחוק את פריט התוכן');
  }
}
