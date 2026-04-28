import { createDataAccessError } from '@/src/lib/error-utils';
import { supabase } from '@/src/lib/supabase';
import type { Council, TablesInsert } from '@/src/types/database';

export async function listCouncils(): Promise<Council[]> {
  const { data, error } = await supabase
    .from('regional_councils')
    .select('id, name, plaga_name, regional_squad_name, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן לטעון את רשימת המועצות');
  }

  return data ?? [];
}

export async function createCouncil(
  values: Pick<TablesInsert<'regional_councils'>, 'name' | 'plaga_name' | 'regional_squad_name'>
): Promise<Council> {
  const { data, error } = await supabase
    .from('regional_councils')
    .insert({
      name: values.name.trim(),
      plaga_name: values.plaga_name,
      regional_squad_name: values.regional_squad_name?.trim() || 'כיתת כוננות אזורית',
    })
    .select('id, name, plaga_name, regional_squad_name, created_at, updated_at')
    .single();

  if (error) {
    throw createDataAccessError(error, 'לא ניתן להוסיף מועצה חדשה');
  }

  return data;
}

export async function deleteCouncil(councilId: string) {
  const { error } = await supabase.rpc('delete_regional_council', {
    target_council_id: councilId,
  });

  if (error) {
    throw createDataAccessError(error, 'לא ניתן להסיר את המועצה כרגע');
  }
}
