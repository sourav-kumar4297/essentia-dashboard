export const INDIA_PHONE_PREFIX = "+91 ";

/** Digits only, after stripping common separators. */
export function phoneDigits(value: string): string {
  return value.replace(/[\s\-().]/g, "").replace(/^\+/, "");
}

/** Keep +91 prefix filled; user types the 10-digit mobile. */
export function withIndiaPhonePrefix(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return INDIA_PHONE_PREFIX + digits.slice(0, 10);
}

/**
 * Accepts Indian mobiles (+91 / 91 / 0 / bare 10-digit) and general
 * E.164-style numbers (8–15 digits after optional country code).
 */
export function isValidPhone(value: string): boolean {
  const raw = value.trim();
  if (!raw) return false;

  const cleaned = raw.replace(/[\s\-().]/g, "");
  // +91 98765 43210 / 919876543210 / 09876543210 / 9876543210
  if (/^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned)) return true;

  // Other international: + and 8–15 digits total
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) return true;

  return false;
}

export const PHONE_FORMAT_HINT =
  "Enter a valid 10-digit mobile number after +91.";
