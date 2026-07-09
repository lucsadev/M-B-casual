/**
 * Catalog query interfaces for product listing, filtering, and pagination.
 *
 * These types define the contract between the API layer and UI components
 * across both web and mobile applications.
 */

/**
 * Filters applied to the product catalog query.
 * All fields are optional — unset filters are omitted from the query.
 */
export interface CatalogFilters {
  /** Category slug to filter by (e.g. 'mujer', 'hombre') */
  category?: string;
  /** Free-text search query (matched via pg_trgm ILIKE on name) */
  search?: string;
  /** Comma-separated tag filter (e.g. 'nuevo,oferta') */
  tags?: string;
  /** Minimum price filter */
  priceMin?: number;
  /** Maximum price filter */
  priceMax?: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}

/**
 * Sort parameters for catalog queries.
 */
export interface CatalogSort {
  /** Field to sort by */
  field: 'price' | 'name' | 'created_at';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Pagination parameters derived from CatalogFilters.
 */
export interface PaginationParams {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Offset for SQL queries */
  offset: number;
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrevious: boolean;
}
