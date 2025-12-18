/**
 * Pagination Utilities
 * Validates: Requirements 6.3
 */

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Paginate an array of items
 * @param items - Full array of items
 * @param params - Pagination parameters
 * @returns Paginated result
 */
export function paginateItems<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { page, pageSize } = params
  
  // Validate inputs
  const validPage = Math.max(1, page)
  const validPageSize = Math.max(1, pageSize)
  
  const total = items.length
  const totalPages = Math.ceil(total / validPageSize)
  
  // Calculate offset
  const offset = (validPage - 1) * validPageSize
  
  // Get items for current page
  const paginatedItems = items.slice(offset, offset + validPageSize)
  
  return {
    items: paginatedItems,
    total,
    page: validPage,
    pageSize: validPageSize,
    totalPages,
  }
}

/**
 * Merge paginated results into a single array
 * Maintains order and handles duplicates by ID
 * @param pages - Array of paginated results
 * @param getId - Function to get unique ID from item
 * @returns Merged array of items
 */
export function mergePaginatedResults<T>(
  pages: PaginatedResult<T>[],
  getId: (item: T) => string
): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  
  for (const page of pages) {
    for (const item of page.items) {
      const id = getId(item)
      if (!seen.has(id)) {
        seen.add(id)
        result.push(item)
      }
    }
  }
  
  return result
}

/**
 * Check if there are more pages to load
 * @param result - Current paginated result
 * @returns True if there are more pages
 */
export function hasMorePages<T>(result: PaginatedResult<T>): boolean {
  return result.page < result.totalPages
}

/**
 * Get the next page number
 * @param result - Current paginated result
 * @returns Next page number or undefined if no more pages
 */
export function getNextPage<T>(result: PaginatedResult<T>): number | undefined {
  if (hasMorePages(result)) {
    return result.page + 1
  }
  return undefined
}
