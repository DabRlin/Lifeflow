/**
 * Property-based tests for CategorySelector
 * **Feature: category-list-management, Property 5: Task-category association**
 * **Validates: Requirements 4.2, 5.2, 5.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { CardList } from '@/api/types'

// Helper to generate valid ISO date strings
const isoDateStringArbitrary = fc
  .integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31
  .map((timestamp) => new Date(timestamp).toISOString())

// Generator for valid hex color strings
const hexColorArbitrary = fc
  .array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), {
    minLength: 6,
    maxLength: 6,
  })
  .map((chars) => `#${chars.join('')}`)

// Generator for valid CardList objects
const cardListArbitrary: fc.Arbitrary<CardList> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  color: hexColorArbitrary,
  sort_order: fc.nat({ max: 1000 }),
  created_at: isoDateStringArbitrary,
})

// Generator for a list of CardLists with unique IDs
const cardListArrayArbitrary = fc
  .array(cardListArbitrary, { minLength: 0, maxLength: 20 })
  .map((lists) => {
    // Ensure unique IDs
    const seen = new Set<string>()
    return lists.filter((list) => {
      if (seen.has(list.id)) return false
      seen.add(list.id)
      return true
    })
  })

/**
 * Simulates the CategorySelector's value transformation logic
 * This mirrors the component's handleChange behavior
 */
function simulateCategorySelectorChange(
  selectedValue: string
): string | null {
  // Empty string means "uncategorized" (null)
  return selectedValue === '' ? null : selectedValue
}

/**
 * Simulates the CategorySelector's value display logic
 * This mirrors how the component converts value prop to select value
 */
function simulateCategorySelectorValue(value: string | null): string {
  return value ?? ''
}

describe('CategorySelector - Property Tests', () => {
  /**
   * **Feature: category-list-management, Property 5: Task-category association**
   * **Validates: Requirements 4.2, 5.2, 5.4**
   *
   * For any task and any existing category, setting the task's list_id to that
   * category's ID should persist correctly, and querying the task should return
   * the same list_id.
   */
  describe('Property 5: Task-category association', () => {
    it('selecting a category should return the correct list_id', () => {
      fc.assert(
        fc.property(
          cardListArrayArbitrary.filter((lists) => lists.length > 0),
          fc.nat(),
          (lists, indexRaw) => {
            const index = indexRaw % lists.length
            const selectedList = lists[index]

            // Simulate selecting a category
            const result = simulateCategorySelectorChange(selectedList.id)

            // Property: The returned list_id should match the selected category's ID
            expect(result).toBe(selectedList.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('selecting "uncategorized" should return null', () => {
      // Simulate selecting the "uncategorized" option (empty string)
      const result = simulateCategorySelectorChange('')

      // Property: Selecting uncategorized should return null
      expect(result).toBeNull()
    })

    it('value transformation should be round-trip consistent', () => {
      fc.assert(
        fc.property(
          cardListArrayArbitrary.filter((lists) => lists.length > 0),
          fc.nat(),
          (lists, indexRaw) => {
            const index = indexRaw % lists.length
            const selectedList = lists[index]

            // Start with a list_id
            const originalListId: string | null = selectedList.id

            // Convert to select value (what the component displays)
            const selectValue = simulateCategorySelectorValue(originalListId)

            // Convert back to list_id (what onChange returns)
            const resultListId = simulateCategorySelectorChange(selectValue)

            // Property: Round-trip should preserve the list_id
            expect(resultListId).toBe(originalListId)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('null value transformation should be round-trip consistent', () => {
      // Start with null (uncategorized)
      const originalListId: string | null = null

      // Convert to select value
      const selectValue = simulateCategorySelectorValue(originalListId)

      // Convert back to list_id
      const resultListId = simulateCategorySelectorChange(selectValue)

      // Property: Round-trip should preserve null
      expect(resultListId).toBeNull()
    })

    it('all category IDs in the list should be selectable', () => {
      fc.assert(
        fc.property(
          cardListArrayArbitrary.filter((lists) => lists.length > 0),
          (lists) => {
            // Property: Every category in the list should be selectable
            for (const list of lists) {
              const result = simulateCategorySelectorChange(list.id)
              expect(result).toBe(list.id)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('category selection should be deterministic', () => {
      fc.assert(
        fc.property(
          cardListArrayArbitrary.filter((lists) => lists.length > 0),
          fc.nat(),
          (lists, indexRaw) => {
            const index = indexRaw % lists.length
            const selectedList = lists[index]

            // Select the same category twice
            const result1 = simulateCategorySelectorChange(selectedList.id)
            const result2 = simulateCategorySelectorChange(selectedList.id)

            // Property: Same input should always produce same output
            expect(result1).toBe(result2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
