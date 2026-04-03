export function normalizeSearchText(value: string | null | undefined) {
  return (
    value
      ?.normalize('NFKD')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase() ?? ''
  );
}

export function matchesSearchQuery(
  candidates: Array<string | null | undefined>,
  query: string
) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return candidates.some((candidate) =>
    normalizeSearchText(candidate).includes(normalizedQuery)
  );
}
