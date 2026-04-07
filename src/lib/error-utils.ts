export function getErrorMessage(
  error: unknown,
  fallbackMessage = 'אירעה שגיאה לא צפויה'
) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallbackMessage;
}

const technicalErrorPatterns = [
  /violates row-level security/i,
  /permission denied/i,
  /schema cache/i,
  /\brelation\b/i,
  /\bcolumn\b/i,
  /duplicate key/i,
  /invalid input syntax/i,
  /json object requested/i,
  /multiple \(or no\) rows/i,
  /failed to fetch/i,
  /network request failed/i,
  /fetch failed/i,
  /jwt/i,
  /pgrst/i,
  /42p01/i,
  /42501/i,
  /42703/i,
  /23505/i,
  /unauthorized/i,
];

function looksTechnicalErrorMessage(message: string) {
  return technicalErrorPatterns.some((pattern) => pattern.test(message));
}

export function getPresentableErrorMessage(
  error: unknown,
  fallbackMessage = 'אירעה שגיאה לא צפויה'
) {
  const message = getErrorMessage(error, '').trim();

  if (!message) {
    return fallbackMessage;
  }

  if (looksTechnicalErrorMessage(message)) {
    return fallbackMessage;
  }

  return message;
}

export function createDataAccessError(
  error: unknown,
  fallbackMessage: string
) {
  return new Error(getPresentableErrorMessage(error, fallbackMessage));
}
