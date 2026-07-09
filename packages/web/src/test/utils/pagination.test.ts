import { describe, it, expect } from 'vitest';
import { buildPagination, buildPaginatedResponse } from '@mbt/shared';

describe('buildPagination', () => {
  it('returns offset 0 for page 1', () => {
    const result = buildPagination(1, 20);
    expect(result).toEqual({ page: 1, pageSize: 20, offset: 0 });
  });

  it('calculates offset correctly for page 3', () => {
    const result = buildPagination(3, 10);
    expect(result).toEqual({ page: 3, pageSize: 10, offset: 20 });
  });

  it('clamps page to minimum 1', () => {
    const result = buildPagination(0, 20);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('clamps negative pages to 1', () => {
    const result = buildPagination(-5, 20);
    expect(result.page).toBe(1);
  });

  it('floors decimal pages', () => {
    const result = buildPagination(2.7, 20);
    expect(result.page).toBe(2);
    expect(result.offset).toBe(20);
  });

  it('clamps pageSize to max 100', () => {
    const result = buildPagination(1, 200);
    expect(result.pageSize).toBe(100);
  });

  it('clamps pageSize to minimum 1', () => {
    const result = buildPagination(1, 0);
    expect(result.pageSize).toBe(1);
  });

  it('floors decimal pageSize', () => {
    const result = buildPagination(1, 15.9);
    expect(result.pageSize).toBe(15);
  });

  it('defaults pageSize to 20', () => {
    const result = buildPagination(1);
    expect(result.pageSize).toBe(20);
  });
});

describe('buildPaginatedResponse', () => {
  const items = [{ id: '1' }, { id: '2' }];
  const params = { page: 1, pageSize: 10, offset: 0 };

  it('returns correct structure for first page', () => {
    const result = buildPaginatedResponse(items, 25, params);
    expect(result).toEqual({
      data: items,
      total: 25,
      page: 1,
      pageSize: 10,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false,
    });
  });

  it('marks hasPrevious true for page 2+', () => {
    const result = buildPaginatedResponse(items, 25, { page: 2, pageSize: 10, offset: 10 });
    expect(result.hasPrevious).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('marks hasNext false on last page', () => {
    const result = buildPaginatedResponse(items, 25, { page: 3, pageSize: 10, offset: 20 });
    expect(result.hasNext).toBe(false);
  });

  it('returns at least 1 totalPage', () => {
    const result = buildPaginatedResponse([], 0, params);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrevious).toBe(false);
  });

  it('rounds up totalPages', () => {
    const result = buildPaginatedResponse(items, 11, { page: 1, pageSize: 10, offset: 0 });
    expect(result.totalPages).toBe(2);
  });
});
