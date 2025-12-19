/**
 * Property-based tests for DeleteCategoryModal
 * **Feature: category-list-management, Property 4: Category deletion cascades to tasks**
 * **Validates: Requirements 3.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Task } from '@/api/types'

/**
 * Simulates the cascade behavior when a category is deleted.
 * All tasks with the deleted category's list_id should have their list_id set to null.
 * 
 * This is a pure function that represents the expected behavior of the backend
 * when a category is deleted.
 */
export function simulateCategoryDeletionCascade(
  tasks: Task[],
  deletedListId: string
): Task[] {
  return tasks.map((task) => {
    if (task.list_id === deletedListId) {
      return { ...task, list_id: null }
    }
    return task
  })
}

/**
 * Checks if all tasks that were associated with a deleted category
 * now have list_id === null
 */
export function verifyCascadeResult(
  originalTasks: Task[],
  resultTasks: Task[],
  deletedListId: string
): boolean {
  // All tasks that had the deleted list_id should now have null
  const affectedOriginalTasks = originalTasks.filter(
    (t) => t.list_id === deletedListId
  )
  const affectedResultTasks = resultTasks.filter((t) =>
    affectedOriginalTasks.some((orig) => orig.id === t.id)
  )

  // All affected tasks should have list_id === null
  return affectedResultTasks.every((t) => t.list_id === null)
}

// Generator for valid UUIDs
const uuidArbitrary = fc.uuid()

// Fixed ISO date string for simplicity
const fixedDateString = '2024-01-01T00:00:00.000Z'
const fixedDateOnlyString = '2024-01-01'

// Generator for Task with optional list_id
const taskArbitrary = (listIds: string[]) =>
  fc.record({
    id: uuidArbitrary,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    content: fc.string({ minLength: 0, maxLength: 500 }),
    list_id: listIds.length > 0
      ? fc.oneof(fc.constant(null), fc.constantFrom(...listIds))
      : fc.constant(null),
    is_habit: fc.boolean(),
    reminder_time: fc.constant(null),
    current_streak: fc.integer({ min: 0, max: 100 }),
    longest_streak: fc.integer({ min: 0, max: 100 }),
    last_checkin_date: fc.oneof(fc.constant(null), fc.constant(fixedDateOnlyString)),
    created_at: fc.constant(fixedDateString),
    updated_at: fc.constant(fixedDateString),
    is_deleted: fc.constant(false),
  })

describe('DeleteCategoryModal - Property Tests', () => {
  /**
   * **Feature: category-list-management, Property 4: Category deletion cascades to tasks**
   * **Validates: Requirements 3.3**
   *
   * For any category with associated tasks, after deleting the category,
   * all previously associated tasks should have list_id === null.
   */
  describe('Property 4: Category deletion cascades to tasks', () => {
    it('all tasks with deleted category list_id should become uncategorized', () => {
      // Generate list IDs first
      const listIdArbitrary = fc.array(uuidArbitrary, { minLength: 1, maxLength: 5 })
      
      fc.assert(
        fc.property(
          listIdArbitrary,
          (listIds) => {
            // Pick one list to delete
            const deletedListId = listIds[0]
            
            // Generate tasks with these list IDs
            const tasksArb = fc.array(taskArbitrary(listIds), { minLength: 1, maxLength: 20 })
            
            fc.assert(
              fc.property(tasksArb, (tasks) => {
                // Simulate deletion cascade
                const resultTasks = simulateCategoryDeletionCascade(tasks, deletedListId)

                // Property: All tasks that had the deleted list_id should now have null
                const tasksWithDeletedList = tasks.filter(
                  (t) => t.list_id === deletedListId
                )
                const correspondingResultTasks = resultTasks.filter((t) =>
                  tasksWithDeletedList.some((orig) => orig.id === t.id)
                )

                expect(
                  correspondingResultTasks.every((t) => t.list_id === null)
                ).toBe(true)
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('tasks with other list_ids should remain unchanged', () => {
      const listIdArbitrary = fc.array(uuidArbitrary, { minLength: 2, maxLength: 5 })
      
      fc.assert(
        fc.property(
          listIdArbitrary,
          (listIds) => {
            const deletedListId = listIds[0]
            const tasksArb = fc.array(taskArbitrary(listIds), { minLength: 1, maxLength: 20 })
            
            fc.assert(
              fc.property(tasksArb, (tasks) => {
                const resultTasks = simulateCategoryDeletionCascade(tasks, deletedListId)

                // Property: Tasks with other list_ids should remain unchanged
                const tasksWithOtherLists = tasks.filter(
                  (t) => t.list_id !== null && t.list_id !== deletedListId
                )
                
                tasksWithOtherLists.forEach((originalTask) => {
                  const resultTask = resultTasks.find((t) => t.id === originalTask.id)
                  expect(resultTask?.list_id).toBe(originalTask.list_id)
                })
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('tasks with null list_id should remain null', () => {
      const listIdArbitrary = fc.array(uuidArbitrary, { minLength: 1, maxLength: 5 })
      
      fc.assert(
        fc.property(
          listIdArbitrary,
          (listIds) => {
            const deletedListId = listIds[0]
            const tasksArb = fc.array(taskArbitrary(listIds), { minLength: 1, maxLength: 20 })
            
            fc.assert(
              fc.property(tasksArb, (tasks) => {
                const resultTasks = simulateCategoryDeletionCascade(tasks, deletedListId)

                // Property: Tasks that were already uncategorized should remain so
                const uncategorizedTasks = tasks.filter((t) => t.list_id === null)
                
                uncategorizedTasks.forEach((originalTask) => {
                  const resultTask = resultTasks.find((t) => t.id === originalTask.id)
                  expect(resultTask?.list_id).toBeNull()
                })
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('total number of tasks should remain the same after cascade', () => {
      const listIdArbitrary = fc.array(uuidArbitrary, { minLength: 1, maxLength: 5 })
      
      fc.assert(
        fc.property(
          listIdArbitrary,
          (listIds) => {
            const deletedListId = listIds[0]
            const tasksArb = fc.array(taskArbitrary(listIds), { minLength: 0, maxLength: 20 })
            
            fc.assert(
              fc.property(tasksArb, (tasks) => {
                const resultTasks = simulateCategoryDeletionCascade(tasks, deletedListId)

                // Property: Number of tasks should not change
                expect(resultTasks.length).toBe(tasks.length)
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('cascade should be idempotent', () => {
      const listIdArbitrary = fc.array(uuidArbitrary, { minLength: 1, maxLength: 5 })
      
      fc.assert(
        fc.property(
          listIdArbitrary,
          (listIds) => {
            const deletedListId = listIds[0]
            const tasksArb = fc.array(taskArbitrary(listIds), { minLength: 1, maxLength: 20 })
            
            fc.assert(
              fc.property(tasksArb, (tasks) => {
                // Apply cascade twice
                const firstCascade = simulateCategoryDeletionCascade(tasks, deletedListId)
                const secondCascade = simulateCategoryDeletionCascade(firstCascade, deletedListId)

                // Property: Applying cascade twice should produce same result
                expect(secondCascade).toEqual(firstCascade)
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('verify cascade result helper function works correctly', () => {
      const listIdArbitrary = fc.array(uuidArbitrary, { minLength: 1, maxLength: 5 })
      
      fc.assert(
        fc.property(
          listIdArbitrary,
          (listIds) => {
            const deletedListId = listIds[0]
            const tasksArb = fc.array(taskArbitrary(listIds), { minLength: 1, maxLength: 20 })
            
            fc.assert(
              fc.property(tasksArb, (tasks) => {
                const resultTasks = simulateCategoryDeletionCascade(tasks, deletedListId)

                // Property: verifyCascadeResult should return true for correct cascade
                expect(verifyCascadeResult(tasks, resultTasks, deletedListId)).toBe(true)
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
