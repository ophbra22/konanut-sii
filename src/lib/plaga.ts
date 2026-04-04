export const PLAGA_VALUES = ['פלגת לכיש', 'פלגת נגב'] as const;

export type PlagaName = (typeof PLAGA_VALUES)[number];

export function normalizePlagaName(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

export function isPlagaName(value: string | null | undefined): value is PlagaName {
  const normalizedValue = normalizePlagaName(value);

  return (
    normalizedValue === PLAGA_VALUES[0] ||
    normalizedValue === PLAGA_VALUES[1]
  );
}
