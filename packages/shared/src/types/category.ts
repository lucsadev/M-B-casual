/**
 * Category groups products for navigation and filtering.
 * Maps to the `categories` table in Supabase.
 */
export interface Category {
  /** UUID primary key */
  id: string;
  /** Display name (e.g., "Mujer", "Hombre", "Accesorios") */
  name: string;
  /** URL-friendly unique identifier */
  slug: string;
  /** Short description of the category */
  description?: string;
  /** URL to the category cover image in Supabase Storage */
  imageUrl?: string;
  /** Numeric position for ordering in navigation */
  sortOrder: number;
  /** ISO timestamp of creation */
  createdAt: string;
}
