import type { PaginationParams, PaginatedResponse } from '../types/catalog.ts';

/**
 * Build pagination parameters from page and pageSize.
 * Clamps page to minimum 1 and pageSize between 1 and 100.
 *
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page (default: 20)
 * @returns PaginationParams with offset calculated
 *
 * @example
 * buildPagination(1, 20)  // => { page: 1, pageSize: 20, offset: 0 }
 * buildPagination(3, 10)  // => { page: 3, pageSize: 10, offset: 20 }
 */
export function buildPagination(
  page: number,
  pageSize: number = 20,
): PaginationParams {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));

  return {
    page: safePage,
    pageSize: safePageSize,
    offset: (safePage - 1) * safePageSize,
  };
}

/**
 * Build a PaginatedResponse from raw data and pagination params.
 *
 * @param data - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param params - PaginationParams used for the query
 * @returns PaginatedResponse<T>
 *
 * @example
 * buildPaginatedResponse(items, 100, { page: 1, pageSize: 20, offset: 0 })
 * // => { data: items, total: 100, page: 1, pageSize: 20, totalPages: 5, hasNext: true, hasPrevious: false }
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));

  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrevious: params.page > 1,
  };
}
