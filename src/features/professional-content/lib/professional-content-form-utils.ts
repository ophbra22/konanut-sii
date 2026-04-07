import type { ProfessionalContentFormValues } from '@/src/features/professional-content/schemas/professional-content-form-schema';
import { professionalContentTypes } from '@/src/features/professional-content/constants';
import type {
  ProfessionalContent,
  TablesInsert,
  TablesUpdate,
} from '@/src/types/database';

function toOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getProfessionalContentFormValues(
  content?: Partial<ProfessionalContent>
): ProfessionalContentFormValues {
  return {
    content_type:
      (content?.content_type as ProfessionalContentFormValues['content_type'] | undefined) ??
      professionalContentTypes[0],
    description: content?.description ?? '',
    is_active: content?.is_active ?? true,
    thumbnail_url: content?.thumbnail_url ?? '',
    title: content?.title ?? '',
    topic: content?.topic ?? '',
    url: content?.url ?? '',
  };
}

export function toProfessionalContentInsertInput(
  values: ProfessionalContentFormValues
): TablesInsert<'professional_content'> {
  return {
    content_type: values.content_type,
    description: toOptionalText(values.description),
    is_active: values.is_active,
    thumbnail_url: toOptionalText(values.thumbnail_url),
    title: values.title.trim(),
    topic: toOptionalText(values.topic),
    url: values.url.trim(),
  };
}

export function toProfessionalContentUpdateInput(
  values: ProfessionalContentFormValues
): TablesUpdate<'professional_content'> {
  return toProfessionalContentInsertInput(values);
}
