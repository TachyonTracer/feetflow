export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 10;

export function normalizePageSize(size: number): number {
  if (size <= 0) return DEFAULT_PAGE_SIZE;
  return size > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : size;
}
