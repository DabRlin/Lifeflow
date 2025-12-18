/**
 * Property-based tests for Life Entry Pagination
 * **Feature: lifeflow-v2, Property 8: Life Entry Pagination**
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  paginateItems,
  mergePaginatedResults,
  hasMorePages,
  getNextPage,
  type PaginatedResult,
} from './pagination'

// Helper to generate items with unique IDs
interface TestItem {
  id: string
  value: number
}

const testItemArb = fc.record({
  id: fc.uuid(),
  value: fc.integer(),
})

const testItemsArb = fc.array(testItemArb, { minLength: 0, maxLength: 100 })

// Helper to generate valid pagination params
const paginationParamsArb = fc.record({
  page: fc.integer({ min: 1, max: 20 }),
  pageSize: fc.integer({ min: 1, max: 50 }),
})

describe('Life Entry Pagination - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 8: Life Entry Pagination**
   * **Validates: Requirements 6.3**
   * 
   * For any page request with limit and offset, the returned entries should be
   * correctly paginated and maintain consistent ordering across pages.
   */
  describe('Property 8: Life Entry Pagination', () => {
    it('should return empty items for empty input', () => {
      fc.assert(
        fc.property(paginationParamsArb, (params) => {
          const result = paginateItems<TestItem>([], params)
          
          expect(result.items).toEqual([])
          expect(result.total).toBe(0)
          expect(result.totalPages).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should return correct number of items per page', () => {
      fc.assert(
        fc.property(testItemsArb, paginationParamsArb, (items, params) => {
          const result = paginateItems(items, params)
          
          // Items per page should not exceed pageSize
          expect(result.items.length).toBeLessThanOrEqual(params.pageSize)
          
          // If not the last page, should have exactly pageSize items
          if (result.page < result.totalPages) {
            expect(result.items.length).toBe(params.pageSize)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should calculate total pages correctly', () => {
      fc.assert(
        fc.property(testItemsArb, paginationParamsArb, (items, params) => {
          const result = paginateItems(items, params)
          
          const expectedTotalPages = Math.ceil(items.length / params.pageSize)
          expect(result.totalPages).toBe(expectedTotalPages)
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain consistent ordering across pages', () => {
      fc.assert(
        fc.property(
          fc.array(testItemArb, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          (items, pageSize) => {
            // Collect all items from all pages
            const allPaginatedItems: TestItem[] = []
            const totalPages = Math.ceil(items.length / pageSize)
            
            for (let page = 1; page <= totalPages; page++) {
              const result = paginateItems(items, { page, pageSize })
              allPaginatedItems.push(...result.items)
            }
            
            // All paginated items should match original items in order
            expect(allPaginatedItems.length).toBe(items.length)
            for (let i = 0; i < items.length; i++) {
              expect(allPaginatedItems[i].id).toBe(items[i].id)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not have overlapping items between pages', () => {
      fc.assert(
        fc.property(
          fc.array(testItemArb, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          (items, pageSize) => {
            const seenIds = new Set<string>()
            const totalPages = Math.ceil(items.length / pageSize)
            
            for (let page = 1; page <= totalPages; page++) {
              const result = paginateItems(items, { page, pageSize })
              
              for (const item of result.items) {
                // Each item should appear only once across all pages
                expect(seenIds.has(item.id)).toBe(false)
                seenIds.add(item.id)
              }
            }
            
            // All items should be covered
            expect(seenIds.size).toBe(items.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty items for page beyond total pages', () => {
      fc.assert(
        fc.property(
          fc.array(testItemArb, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (items, pageSize) => {
            const totalPages = Math.ceil(items.length / pageSize)
            const beyondPage = totalPages + 1
            
            const result = paginateItems(items, { page: beyondPage, pageSize })
            
            expect(result.items).toEqual([])
            expect(result.page).toBe(beyondPage)
            expect(result.total).toBe(items.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle page 1 correctly', () => {
      fc.assert(
        fc.property(
          fc.array(testItemArb, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 20 }),
          (items, pageSize) => {
            const result = paginateItems(items, { page: 1, pageSize })
            
            // First page should start from the beginning
            const expectedItems = items.slice(0, pageSize)
            expect(result.items.length).toBe(expectedItems.length)
            
            for (let i = 0; i < result.items.length; i++) {
              expect(result.items[i].id).toBe(expectedItems[i].id)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve total count across all pages', () => {
      fc.assert(
        fc.property(testItemsArb, paginationParamsArb, (items, params) => {
          const result = paginateItems(items, params)
          
          expect(result.total).toBe(items.length)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Pagination Helper Functions', () => {
    it('hasMorePages should return true when page < totalPages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 2, max: 20 }),
          (page, totalPages) => {
            fc.pre(page < totalPages)
            
            const result: PaginatedResult<TestItem> = {
              items: [],
              total: totalPages * 10,
              page,
              pageSize: 10,
              totalPages,
            }
            
            expect(hasMorePages(result)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('hasMorePages should return false when page >= totalPages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (page, totalPages) => {
            fc.pre(page >= totalPages)
            
            const result: PaginatedResult<TestItem> = {
              items: [],
              total: totalPages * 10,
              page,
              pageSize: 10,
              totalPages,
            }
            
            expect(hasMorePages(result)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getNextPage should return page + 1 when more pages exist', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 2, max: 20 }),
          (page, totalPages) => {
            fc.pre(page < totalPages)
            
            const result: PaginatedResult<TestItem> = {
              items: [],
              total: totalPages * 10,
              page,
              pageSize: 10,
              totalPages,
            }
            
            expect(getNextPage(result)).toBe(page + 1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getNextPage should return undefined when no more pages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (totalPages) => {
            const result: PaginatedResult<TestItem> = {
              items: [],
              total: totalPages * 10,
              page: totalPages,
              pageSize: 10,
              totalPages,
            }
            
            expect(getNextPage(result)).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('mergePaginatedResults should combine all items without duplicates', () => {
      fc.assert(
        fc.property(
          fc.array(testItemArb, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (items, pageSize) => {
            // Create paginated results
            const pages: PaginatedResult<TestItem>[] = []
            const totalPages = Math.ceil(items.length / pageSize)
            
            for (let page = 1; page <= totalPages; page++) {
              pages.push(paginateItems(items, { page, pageSize }))
            }
            
            const merged = mergePaginatedResults(pages, (item) => item.id)
            
            // Merged should have all items
            expect(merged.length).toBe(items.length)
            
            // Order should be preserved
            for (let i = 0; i < items.length; i++) {
              expect(merged[i].id).toBe(items[i].id)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
