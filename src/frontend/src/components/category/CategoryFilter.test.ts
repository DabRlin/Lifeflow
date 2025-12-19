/**
 * Property-based tests for CategoryFilter
 * **Feature: category-list-management, Property 6: Category filter correctness**
 * **Validates: Requirements 6.2, 6.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { filterTasksByCategory } from './CategoryFilter'
import type { CardList, Task } from '@/api/types'

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
  .array(cardListArbitrary, { minLength: 0, maxLength: 10 })
  .map((lists) => {
    const seen = new Set<string>()
    return lists.filter((list) => {
      if (seen.has(list.id)) return false
      seen.add(list.id)
      return true
    })
  })

// Generator for Task objects with optional list_id
const taskArbitrary = (listIds: string[]): fc.Arbitrary<Task> => {
  const listIdArbitrary: fc.Arbitrary<string | null> = listIds.length > 0
    ? fc.oneof(fc.constant(null as string | null), fc.constantFrom(...listIds))
    : fc.constant(null as string | null)

  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    content: fc.string({ maxLength: 1000 }),
    list_id: listIdArbitrary,
    is_habit: fc.boolean(),
    reminder_time: fc.oneof(fc.constant(null as string | null), isoDateStringArbitrary),
    current_streak: fc.nat({ max: 365 }),
    longest_streak: fc.nat({ max: 365 }),
    last_checkin_date: fc.oneof(fc.constant(null as string | null), isoDateStringArbitrary),
    created_at: isoDateStringArbitrary,
    updated_at: isoDateStringArbitrary,
    is_deleted: fc.constant(false),
  })
}

// Generator for tasks with list_ids from a given set of lists (with unique IDs)
const tasksWithListsArbitrary = (lists: CardList[]): fc.Arbitrary<Task[]> => {
  const listIds = lists.map((l) => l.id)
  return fc.array(taskArbitrary(listIds), { minLength: 0, maxLength: 20 }).map((tasks) => {
    // Ensure unique task IDs
    const seen = new Set<string>()
    return tasks.filter((task) => {
      if (seen.has(task.id)) return false
      seen.add(task.id)
      return true
    })
  })
}

// Combined generator for lists and tasks
const listsAndTasksArbitrary: fc.Arbitrary<{ lists: CardList[]; tasks: Task[] }> = 
  cardListArrayArbitrary.chain((lists) =>
    tasksWithListsArbitrary(lists).map((tasks) => ({ lists, tasks }))
  )

// Combined generator for lists, tasks, and a selected list ID
const listsTasksAndSelectionArbitrary: fc.Arbitrary<{
  lists: CardList[]
  tasks: Task[]
  selectedListId: string | null
}> = cardListArrayArbitrary
  .filter((lists) => lists.length > 0)
  .chain((lists) =>
    tasksWithListsArbitrary(lists).chain((tasks) =>
      fc.nat({ max: Math.max(0, lists.length - 1) }).map((index) => ({
        lists,
        tasks,
        selectedListId: lists[index]?.id ?? null,
      }))
    )
  )

describe('CategoryFilter - Property Tests', () => {
  /**
   * **Feature: category-list-management, Property 6: Category filter correctness**
   * **Validates: Requirements 6.2, 6.3**
   *
   * For any category filter selection, the returned tasks should only include
   * tasks where list_id matches the selected category ID (or all tasks when
   * "All" is selected).
   */
  describe('Property 6: Category filter correctness', () => {
    it('filtering by null (All) should return all tasks', () => {
      fc.assert(
        fc.property(listsAndTasksArbitrary, ({ tasks }) => {
          // Filter with null (All)
          const result = filterTasksByCategory(tasks, null)

          // Property: All tasks should be returned
          expect(result).toHaveLength(tasks.length)
          expect(result).toEqual(tasks)
        }),
        { numRuns: 100 }
      )
    })

    it('filtering by a specific category should return only matching tasks', () => {
      fc.assert(
        fc.property(listsTasksAndSelectionArbitrary, ({ tasks, selectedListId }) => {
          if (selectedListId === null) return // Skip if no valid list

          // Filter by specific category
          const result = filterTasksByCategory(tasks, selectedListId)

          // Property: All returned tasks should have matching list_id
          for (const task of result) {
            expect(task.list_id).toBe(selectedListId)
          }

          // Property: No matching tasks should be excluded
          const expectedCount = tasks.filter((t) => t.list_id === selectedListId).length
          expect(result).toHaveLength(expectedCount)
        }),
        { numRuns: 100 }
      )
    })

    it('filtering should not modify the original tasks', () => {
      fc.assert(
        fc.property(listsTasksAndSelectionArbitrary, ({ tasks, selectedListId }) => {
          // Make a deep copy of original tasks
          const originalTasks = JSON.parse(JSON.stringify(tasks)) as Task[]

          // Filter tasks
          filterTasksByCategory(tasks, selectedListId)

          // Property: Original tasks should not be modified
          expect(tasks).toEqual(originalTasks)
        }),
        { numRuns: 100 }
      )
    })

    it('filtering should be idempotent', () => {
      fc.assert(
        fc.property(listsTasksAndSelectionArbitrary, ({ tasks, selectedListId }) => {
          // Filter once
          const result1 = filterTasksByCategory(tasks, selectedListId)

          // Filter the result again with the same filter
          const result2 = filterTasksByCategory(result1, selectedListId)

          // Property: Filtering twice should give the same result
          expect(result2).toEqual(result1)
        }),
        { numRuns: 100 }
      )
    })

    it('filtering by non-existent category should return empty array', () => {
      const arbitraryWithNonExistent = listsAndTasksArbitrary.chain(({ lists, tasks }) =>
        fc.uuid().map((nonExistentId) => ({ lists, tasks, nonExistentId }))
      )

      fc.assert(
        fc.property(arbitraryWithNonExistent, ({ lists, tasks, nonExistentId }) => {
          // Ensure the ID doesn't exist in lists
          const existingIds = new Set(lists.map((l) => l.id))
          if (existingIds.has(nonExistentId)) return // Skip if collision

          // Also ensure no task has this list_id
          const tasksWithoutNonExistent = tasks.filter((t) => t.list_id !== nonExistentId)

          // Filter by non-existent category
          const result = filterTasksByCategory(tasksWithoutNonExistent, nonExistentId)

          // Property: Should return empty array
          expect(result).toHaveLength(0)
        }),
        { numRuns: 100 }
      )
    })

    it('union of all category filters (excluding "All") should equal all tasks', () => {
      fc.assert(
        fc.property(listsAndTasksArbitrary, ({ lists, tasks }) => {
          // Get all category IDs (not including null, which means "All")
          const categoryIds = lists.map((l) => l.id)
          
          // Filter by each category and collect results
          const allFilteredTasks: Task[] = []
          
          // Add tasks from each category
          for (const listId of categoryIds) {
            const filtered = filterTasksByCategory(tasks, listId)
            allFilteredTasks.push(...filtered)
          }
          
          // Add uncategorized tasks (list_id === null)
          const uncategorizedTasks = tasks.filter((t) => t.list_id === null)
          allFilteredTasks.push(...uncategorizedTasks)

          // Property: Union of all category filters + uncategorized should equal all tasks
          expect(allFilteredTasks).toHaveLength(tasks.length)

          // Verify each task appears exactly once
          const taskIds = tasks.map((t) => t.id).sort()
          const filteredIds = allFilteredTasks.map((t) => t.id).sort()
          expect(filteredIds).toEqual(taskIds)
        }),
        { numRuns: 100 }
      )
    })
  })
})
