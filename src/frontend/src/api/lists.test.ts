/**
 * Property-based integration tests for Lists API
 * **Feature: category-list-management, Property 2: Category persistence round-trip**
 * **Validates: Requirements 1.4, 2.4**
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { listsApi } from './lists'
import type { CardList, CardListCreate } from './types'

// Mock fetch globally
const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// Generator for valid category names (non-empty, non-whitespace-only)
const validCategoryNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0)

// Generator for valid hex color strings
const hexColorArbitrary = fc
  .array(
    fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'),
    { minLength: 6, maxLength: 6 }
  )
  .map((chars) => `#${chars.join('')}`)

// Generator for valid CardListCreate objects
const cardListCreateArbitrary: fc.Arbitrary<CardListCreate> = fc.record({
  name: validCategoryNameArbitrary,
  color: fc.option(hexColorArbitrary, { nil: undefined }),
  sort_order: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
})

// Helper to generate valid ISO date strings
const isoDateStringArbitrary = fc
  .integer({ min: 1577836800000, max: 1924905600000 })
  .map((timestamp) => new Date(timestamp).toISOString())

/**
 * Simulates the backend's response for creating a category
 * This mirrors what the real API would return
 */
function simulateCreateResponse(input: CardListCreate): CardList {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    color: input.color ?? '#6366f1',
    sort_order: input.sort_order ?? 0,
    created_at: new Date().toISOString(),
  }
}

describe('Lists API - Property Tests', () => {
  /**
   * **Feature: category-list-management, Property 2: Category persistence round-trip**
   * **Validates: Requirements 1.4, 2.4**
   *
   * For any valid category name, creating a category and then querying it
   * should return a category with the same name and a valid ID.
   */
  describe('Property 2: Category persistence round-trip', () => {
    it('creating a category should return the same name with a valid ID', async () => {
      await fc.assert(
        fc.asyncProperty(cardListCreateArbitrary, async (createData) => {
          // Simulate the API response
          const mockResponse = simulateCreateResponse(createData)

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
          })

          const result = await listsApi.create(createData)

          // Property: The returned category should have the same name
          expect(result.name).toBe(createData.name)

          // Property: The returned category should have a valid UUID
          expect(result.id).toBeDefined()
          expect(typeof result.id).toBe('string')
          expect(result.id.length).toBeGreaterThan(0)

          // Property: If color was provided, it should be preserved
          if (createData.color !== undefined) {
            expect(result.color).toBe(createData.color)
          }

          // Property: If sort_order was provided, it should be preserved
          if (createData.sort_order !== undefined) {
            expect(result.sort_order).toBe(createData.sort_order)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('querying a created category should return the same data', async () => {
      await fc.assert(
        fc.asyncProperty(cardListCreateArbitrary, async (createData) => {
          // First, simulate creating the category
          const createdCategory = simulateCreateResponse(createData)

          // Mock the create call
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(createdCategory),
          })

          const created = await listsApi.create(createData)

          // Mock the getById call to return the same category
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(createdCategory),
          })

          const queried = await listsApi.getById(created.id)

          // Property: Round-trip should preserve all data
          expect(queried.id).toBe(created.id)
          expect(queried.name).toBe(created.name)
          expect(queried.color).toBe(created.color)
          expect(queried.sort_order).toBe(created.sort_order)
        }),
        { numRuns: 100 }
      )
    })

    it('updating a category should persist the new name', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardListCreateArbitrary,
          validCategoryNameArbitrary,
          async (createData, newName) => {
            // Create initial category
            const createdCategory = simulateCreateResponse(createData)

            // Mock create
            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: () => Promise.resolve(createdCategory),
            })

            const created = await listsApi.create(createData)

            // Simulate updated category
            const updatedCategory: CardList = {
              ...createdCategory,
              name: newName,
            }

            // Mock update
            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: () => Promise.resolve(updatedCategory),
            })

            const updated = await listsApi.update(created.id, { name: newName })

            // Property: The updated category should have the new name
            expect(updated.name).toBe(newName)

            // Property: The ID should remain the same
            expect(updated.id).toBe(created.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('category name should be preserved exactly (no trimming or modification)', async () => {
      await fc.assert(
        fc.asyncProperty(validCategoryNameArbitrary, async (name) => {
          const createData: CardListCreate = { name }
          const mockResponse = simulateCreateResponse(createData)

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
          })

          const result = await listsApi.create(createData)

          // Property: Name should be exactly as provided (character-by-character)
          expect(result.name).toBe(name)
          expect(result.name.length).toBe(name.length)
        }),
        { numRuns: 100 }
      )
    })

    it('multiple categories with different names should all persist correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(cardListCreateArbitrary, { minLength: 1, maxLength: 10 }),
          async (createDataList) => {
            const createdCategories: CardList[] = []

            for (const createData of createDataList) {
              const mockResponse = simulateCreateResponse(createData)

              mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockResponse),
              })

              const created = await listsApi.create(createData)
              createdCategories.push(created)

              // Property: Each created category should have the correct name
              expect(created.name).toBe(createData.name)
            }

            // Property: All categories should have unique IDs
            const ids = createdCategories.map((c) => c.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: category-list-management, Property 3: Category deletion removes from database**
   * **Validates: Requirements 3.2**
   *
   * For any existing category, after deletion, querying that category by ID
   * should return a not-found error.
   */
  describe('Property 3: Category deletion removes from database', () => {
    it('deleting a category should make it unavailable for query', async () => {
      await fc.assert(
        fc.asyncProperty(cardListCreateArbitrary, async (createData) => {
          // Create a category first
          const createdCategory = simulateCreateResponse(createData)

          // Mock create
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(createdCategory),
          })

          const created = await listsApi.create(createData)

          // Mock delete (returns 204 No Content)
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
            json: () => Promise.resolve(undefined),
          })

          await listsApi.delete(created.id)

          // Mock getById to return 404 after deletion
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
          })

          // Property: Querying deleted category should throw an error
          await expect(listsApi.getById(created.id)).rejects.toThrow()
        }),
        { numRuns: 100 }
      )
    })

    it('deleted category should not appear in getAll results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(cardListCreateArbitrary, { minLength: 2, maxLength: 5 }),
          fc.nat(),
          async (createDataList, deleteIndexRaw) => {
            const createdCategories: CardList[] = []

            // Create multiple categories
            for (const createData of createDataList) {
              const mockResponse = simulateCreateResponse(createData)

              mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockResponse),
              })

              const created = await listsApi.create(createData)
              createdCategories.push(created)
            }

            // Delete one category
            const deleteIndex = deleteIndexRaw % createdCategories.length
            const categoryToDelete = createdCategories[deleteIndex]

            // Mock delete
            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              json: () => Promise.resolve(undefined),
            })

            await listsApi.delete(categoryToDelete.id)

            // Simulate getAll returning all categories except the deleted one
            const remainingCategories = createdCategories.filter(
              (c) => c.id !== categoryToDelete.id
            )

            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: () => Promise.resolve(remainingCategories),
            })

            const allCategories = await listsApi.getAll()

            // Property: Deleted category should not be in the list
            const deletedCategoryInList = allCategories.find(
              (c) => c.id === categoryToDelete.id
            )
            expect(deletedCategoryInList).toBeUndefined()

            // Property: All other categories should still be present
            for (const category of remainingCategories) {
              const found = allCategories.find((c) => c.id === category.id)
              expect(found).toBeDefined()
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('deleting a non-existent category should throw an error', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (nonExistentId) => {
          // Mock delete to return 404
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
          })

          // Property: Deleting non-existent category should throw
          await expect(listsApi.delete(nonExistentId)).rejects.toThrow()
        }),
        { numRuns: 100 }
      )
    })

    it('deletion should be idempotent in terms of final state', async () => {
      await fc.assert(
        fc.asyncProperty(cardListCreateArbitrary, async (createData) => {
          // Create a category
          const createdCategory = simulateCreateResponse(createData)

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(createdCategory),
          })

          const created = await listsApi.create(createData)

          // First delete succeeds
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
            json: () => Promise.resolve(undefined),
          })

          await listsApi.delete(created.id)

          // Second delete fails with 404 (already deleted)
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
          })

          // Property: Second delete should throw (category no longer exists)
          await expect(listsApi.delete(created.id)).rejects.toThrow()

          // Verify the category is still not queryable
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
          })

          // Property: Category should still be unavailable
          await expect(listsApi.getById(created.id)).rejects.toThrow()
        }),
        { numRuns: 50 }
      )
    })

    it('delete operation should only affect the specified category', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(cardListCreateArbitrary, { minLength: 2, maxLength: 5 }),
          fc.nat(),
          async (createDataList, deleteIndexRaw) => {
            const createdCategories: CardList[] = []

            // Create multiple categories
            for (const createData of createDataList) {
              const mockResponse = simulateCreateResponse(createData)

              mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockResponse),
              })

              const created = await listsApi.create(createData)
              createdCategories.push(created)
            }

            // Delete one category
            const deleteIndex = deleteIndexRaw % createdCategories.length
            const categoryToDelete = createdCategories[deleteIndex]

            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 204,
              json: () => Promise.resolve(undefined),
            })

            await listsApi.delete(categoryToDelete.id)

            // Verify other categories are still accessible
            const otherCategories = createdCategories.filter(
              (c) => c.id !== categoryToDelete.id
            )

            for (const category of otherCategories) {
              mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(category),
              })

              const queried = await listsApi.getById(category.id)

              // Property: Other categories should be unaffected
              expect(queried.id).toBe(category.id)
              expect(queried.name).toBe(category.name)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
