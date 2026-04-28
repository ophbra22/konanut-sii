export const MIN_PASSWORD_LENGTH = 8;
export const EMAIL_OTP_MIN_LENGTH = 6;
export const EMAIL_OTP_MAX_LENGTH = 10;

const emailOtpPattern = new RegExp(
  `^\\d{${EMAIL_OTP_MIN_LENGTH},${EMAIL_OTP_MAX_LENGTH}}$`
);

export function isValidEmailOtpToken(value: string) {
  return emailOtpPattern.test(value.trim());
}

export function sanitizeOtpInput(value: string) {
  return value.replace(/\D/g, '').slice(0, EMAIL_OTP_MAX_LENGTH);
}

export function getPasswordMinLengthMessage() {
  return `יש לבחור סיסמה באורך ${MIN_PASSWORD_LENGTH} תווים לפחות`;
}
