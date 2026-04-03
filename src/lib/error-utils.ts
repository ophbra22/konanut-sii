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

export function createDataAccessError(
  error: unknown,
  fallbackMessage: string
) {
  return new Error(getErrorMessage(error, fallbackMessage));
}
