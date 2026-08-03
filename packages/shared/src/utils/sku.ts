import { generateSlug } from './format.ts';

/**
 * Lowercase a single token, replacing runs of non-alphanumeric characters
 * (spaces, punctuation, etc.) with single hyphens and trimming leading /
 * trailing hyphens.
 *
 * Diacritics on letters are PRESERVED (e.g. "Índigo" => "índigo") so that
 * locale-specific color names keep their identity; apply `toUpperCase()` on
 * the result for the final SKU token.
 *
 * Unlike the shared `generateSlug` (which strips diacritics), this helper is
 * Unicode-aware via `\p{L}` so accented characters survive truncation.
 */
export function slugifyToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate an already-slugified token to at most `len` characters.
 * Used to bound the COLOR3 segment to 3 characters.
 *
 * @example truncateToken('blanco', 3) => 'bla'
 */
export function truncateToken(value: string, len = 3): string {
  return value.slice(0, len);
}

/**
 * Map a size label to its SKU SIZE token.
 *
 * - null / empty string => "UNI"
 * - Spanish "Único" / "Única" (diacritic-insensitive, case-insensitive) => "UNI"
 * - any other value => slugified + UPPERCASE
 */
function deriveSizeToken(size: string | null | undefined): string {
  if (!size || size.trim() === '') {
    return 'UNI';
  }

  // Diacritic-insensitive, case-insensitive comparison for the Spanish
  // "one size" marker so "Único", "Única", "UNICO", "unica", etc. all map.
  const normalized = size
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (normalized === 'unico' || normalized === 'unica') {
    return 'UNI';
  }

  return slugifyToken(size).toUpperCase();
}

/**
 * Build the optional COLOR3 token (WITHOUT the leading hyphen).
 * Returns an empty string when the color is absent, causing the segment to
 * be omitted entirely from the resulting SKU.
 */
function deriveColorToken(color: string | null | undefined): string {
  if (!color || color.trim() === '') {
    return '';
  }
  return truncateToken(slugifyToken(color), 3).toUpperCase();
}

/**
 * Zero-pad a 1-based ordinal to 3 digits (1 => "001").
 */
function padOrdinal(n: number): string {
  return n.toString().padStart(3, '0');
}

/**
 * Maximum number of ordinal retries when a generated SKU is already present in
 * the `used` set. Guards the collision loop against pathological (or adversarial)
 * inputs that would otherwise spin forever. Mirrors the 100-attempt cap enforced
 * by the DB trigger's `gen_variant_sku()` PL/pgSQL fallback.
 */
export const MAX_RETRY_ATTEMPTS = 100;

export interface GenerateSkuParams {
  /** Category slug — used verbatim (e.g. "mujer") */
  categorySlug: string;
  /** Product slug — used verbatim (e.g. "camisa-oversize") */
  productSlug: string;
  /** Variant size (null / empty / "Único" => "UNI" fallback) */
  size?: string | null;
  /** Variant color (null / empty => omit the COLOR3 segment) */
  color?: string | null;
  /** 1-based per-product ordinal, zero-padded to 3 digits */
  ordinal: number;
  /** SKUs already claimed within the current batch (collision avoidance) */
  used?: ReadonlySet<string>;
}

/**
 * Auto-generate a deterministic, collision-aware SKU for a product variant.
 *
 * Format: `{CAT_SLUG}-{PRODUCT_SLUG}-{SIZE}-{COLOR3?}-{NNN}`
 *
 * - `CAT_SLUG` / `PRODUCT_SLUG` are slugified via the shared `generateSlug`
 *   (idempotent on clean DB slugs).
 * - `SIZE` is slugified + UPPERCASE; null/empty or "Único"/"Única" => "UNI".
 * - `COLOR3` is an optional 3-char slugified + UPPERCASE token; omitted when
 *   the color is null/empty.
 * - `NNN` is a 3-digit zero-padded ordinal (1 => "001").
 *
 * When `used` is provided, the generated SKU is checked against the set; on a
 * collision the ordinal is incremented and retried until a free SKU is found.
 * The discovered free SKU is NOT mutated back into `used` — the caller owns
 * the set and is responsible for tracking claimed SKUs across a batch.
 *
 * @example
 * generateSku({ categorySlug: 'mujer', productSlug: 'camisa-oversize',
 *   size: 'M', color: 'Blanco', ordinal: 1 })
 * // => "mujer-camisa-oversize-M-BLA-001"
 *
 * @example
 * generateSku({ categorySlug: 'mujer', productSlug: 'cinto-cuero',
 *   size: 'Único', color: null, ordinal: 1 })
 * // => "mujer-cinto-cuero-UNI-001"
 */
export function generateSku(params: GenerateSkuParams): string {
  const { categorySlug, productSlug, size, color, ordinal, used } = params;

  const cat = generateSlug(categorySlug);
  const prod = generateSlug(productSlug);
  const sizeTok = deriveSizeToken(size);
  const colorTok = deriveColorToken(color);

  const colorSegment = colorTok ? `-${colorTok}` : '';
  const base = `${cat}-${prod}-${sizeTok}${colorSegment}`;

  let ordinalValue = ordinal;
  let sku = `${base}-${padOrdinal(ordinalValue)}`;

  if (used) {
    let attempts = 0;
    while (used.has(sku)) {
      attempts += 1;
      if (attempts > MAX_RETRY_ATTEMPTS) {
        throw new Error(
          `SKU generation exceeded max retry attempts (${MAX_RETRY_ATTEMPTS})`,
        );
      }
      ordinalValue += 1;
      sku = `${base}-${padOrdinal(ordinalValue)}`;
    }
  }

  return sku;
}
