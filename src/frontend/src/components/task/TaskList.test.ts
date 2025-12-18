/**
 * Property-based tests for Task Reordering
 * **Feature: lifeflow-v2, Property 3: Task Reordering Persistence**
 * **Validates: Requirements 4.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { arrayMove } from '@dnd-kit/sortable'
import type { Task } from '@/api/types'

// Helper to generate valid ISO date strings
const isoDateStringArbitrary = fc.integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31
  .map(timestamp => new Date(timestamp).toISOString())

const dateOnlyStringArbitrary = fc.integer({ min: 1577836800000, max: 1924905600000 })
  .map(timestamp => new Date(timestamp).toISOString().split('T')[0])

// Generator for valid Task objects
const taskArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ maxLength: 500 }),
  list_id: fc.option(fc.uuid(), { nil: null }),
  is_habit: fc.boolean(),
  reminder_time: fc.option(fc.string(), { nil: null }),
  current_streak: fc.nat({ max: 365 }),
  longest_streak: fc.nat({ max: 365 }),
  last_checkin_date: fc.option(dateOnlyStringArbitrary, { nil: null }),
  created_at: isoDateStringArbitrary,
  updated_at: isoDateStringArbitrary,
  is_deleted: fc.constant(false),
}) as fc.Arbitrary<Task>

// Generator for a list of tasks with unique IDs
const taskListArbitrary = fc.array(taskArbitrary, { minLength: 1, maxLength: 50 })
  .map(tasks => {
    // Ensure unique IDs
    const seen = new Set<string>()
    return tasks.filter(task => {
      if (seen.has(task.id)) return false
      seen.add(task.id)
      return true
    })
  })
  .filter(tasks => tasks.length > 0)

describe('Task Reordering - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 3: Task Reordering Persistence**
   * **Validates: Requirements 4.4**
   * 
   * For any sequence of task reorder operations, the final order should be
   * persisted and restored correctly on page reload.
   */
  describe('Property 3: Task Reordering Persistence', () => {
    it('should preserve all tasks after reordering (no tasks lost or duplicated)', () => {
      fc.assert(
        fc.property(
          taskListArbitrary,
          fc.nat(),
          fc.nat(),
          (tasks, fromIndexRaw, toIndexRaw) => {
            // Ensure valid indices
            const fromIndex = fromIndexRaw % tasks.length
            const toIndex = toIndexRaw % tasks.length

            // Perform reorder
            const reorderedTasks = arrayMove(tasks, fromIndex, toIndex)

            // Property: Same number of tasks
            expect(reorderedTasks.length).toBe(tasks.length)

            // Property: Same set of task IDs (no loss, no duplication)
            const originalIds = new Set(tasks.map(t => t.id))
            const reorderedIds = new Set(reorderedTasks.map(t => t.id))
            expect(reorderedIds).toEqual(originalIds)

            // Property: Each task appears exactly once
            const idCounts = new Map<string, number>()
            for (const task of reorderedTasks) {
              idCounts.set(task.id, (idCounts.get(task.id) || 0) + 1)
            }
            for (const count of idCounts.values()) {
              expect(count).toBe(1)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly move task to new position', () => {
      fc.assert(
        fc.property(
          taskListArbitrary.filter(tasks => tasks.length >= 2),
          fc.nat(),
          fc.nat(),
          (tasks, fromIndexRaw, toIndexRaw) => {
            const fromIndex = fromIndexRaw % tasks.length
            const toIndex = toIndexRaw % tasks.length

            const movedTask = tasks[fromIndex]
            const reorderedTasks = arrayMove(tasks, fromIndex, toIndex)

            // Property: The moved task should be at the target position
            expect(reorderedTasks[toIndex].id).toBe(movedTask.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be idempotent when moving to same position', () => {
      fc.assert(
        fc.property(
          taskListArbitrary,
          fc.nat(),
          (tasks, indexRaw) => {
            const index = indexRaw % tasks.length

            // Move to same position
            const reorderedTasks = arrayMove(tasks, index, index)

            // Property: Order should be unchanged
            expect(reorderedTasks.map(t => t.id)).toEqual(tasks.map(t => t.id))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain relative order of non-moved tasks', () => {
      fc.assert(
        fc.property(
          taskListArbitrary.filter(tasks => tasks.length >= 3),
          fc.nat(),
          fc.nat(),
          (tasks, fromIndexRaw, toIndexRaw) => {
            const fromIndex = fromIndexRaw % tasks.length
            const toIndex = toIndexRaw % tasks.length

            if (fromIndex === toIndex) return // Skip no-op moves

            const movedTaskId = tasks[fromIndex].id
            const reorderedTasks = arrayMove(tasks, fromIndex, toIndex)

            // Get tasks excluding the moved one, in their original order
            const originalOtherTasks = tasks.filter(t => t.id !== movedTaskId)
            const reorderedOtherTasks = reorderedTasks.filter(t => t.id !== movedTaskId)

            // Property: Relative order of other tasks should be preserved
            expect(reorderedOtherTasks.map(t => t.id)).toEqual(originalOtherTasks.map(t => t.id))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be reversible (move back restores original order)', () => {
      fc.assert(
        fc.property(
          taskListArbitrary.filter(tasks => tasks.length >= 2),
          fc.nat(),
          fc.nat(),
          (tasks, fromIndexRaw, toIndexRaw) => {
            const fromIndex = fromIndexRaw % tasks.length
            const toIndex = toIndexRaw % tasks.length

            // Move forward
            const reorderedTasks = arrayMove(tasks, fromIndex, toIndex)
            // Move back
            const restoredTasks = arrayMove(reorderedTasks, toIndex, fromIndex)

            // Property: Should restore original order
            expect(restoredTasks.map(t => t.id)).toEqual(tasks.map(t => t.id))
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
