/**
 * Formats a numeric string with thousand separators (commas).
 * e.g. "1000000" → "1,000,000"
 */
export function formatCurrency(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

/**
 * Parses a formatted currency string back to a number.
 * e.g. "1,000,000" → 1000000
 */
export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}
