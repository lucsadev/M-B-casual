/**
 * Format a number as a price string with currency symbol.
 * Example: formatPrice(1500) => "$1,500.00"
 *
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (default: 'ARS')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Date or ISO string into a human-readable date.
 * Example: formatDate(new Date('2026-07-07')) => "7 jul 2026"
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (default: 'es-AR')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale = 'es-AR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Generate a URL-friendly slug from a text string.
 * Example: generateSlug("Camisa Oversize Blanca") => "camisa-oversize-blanca"
 *
 * @param text - The input string to slugify
 * @returns Lowercase, hyphen-separated slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
