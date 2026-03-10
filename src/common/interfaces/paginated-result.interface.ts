export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export function paginateRaw<T>(
  page: number,
  limit: number,
): { take: number; skip: number } {
  if (limit > 100) limit = 10;
  return {
    take: limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  if (limit > 100) limit = 10;
  return {
    data,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}
