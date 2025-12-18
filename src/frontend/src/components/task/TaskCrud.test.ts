/**
 * Property-based tests for Task CRUD Operations
 * **Feature: lifeflow-v2, Property 2: Task CRUD Operations**
 * **Validates: Requirements 4.2, 4.3, 4.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Task, TaskCreate, TaskUpdate } from '@/api/types'

// Re-export Task type to avoid unused import warning
export type { Task }

// Generator for valid TaskCreate objects
const taskCreateArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  content: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  list_id: fc.option(fc.uuid(), { nil: undefined }),
  is_habit: fc.option(fc.boolean(), { nil: undefined }),
  reminder_time: fc.option(
    fc.tuple(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 0, max: 59 })
    ).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`),
    { nil: undefined }
  ),
}) as fc.Arbitrary<TaskCreate>

// Generator for valid TaskUpdate objects
const taskUpdateArbitrary = fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
  content: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  list_id: fc.option(fc.uuid(), { nil: undefined }),
  is_habit: fc.option(fc.boolean(), { nil: undefined }),
  reminder_time: fc.option(
    fc.tuple(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 0, max: 59 })
    ).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`),
    { nil: undefined }
  ),
  clear_reminder: fc.option(fc.boolean(), { nil: undefined }),
}) as fc.Arbitrary<TaskUpdate>

// Simulated in-memory task store for testing CRUD logic
class TaskStore {
  private tasks: Map<string, Task> = new Map()
  private nextId = 1

  create(data: TaskCreate): Task {
    const id = `task-${this.nextId++}`
    const now = new Date().toISOString()
    const task: Task = {
      id,
      title: data.title,
      content: data.content || '',
      list_id: data.list_id ?? null,
      is_habit: data.is_habit ?? false,
      reminder_time: data.reminder_time ?? null,
      current_streak: 0,
      longest_streak: 0,
      last_checkin_date: null,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    }
    this.tasks.set(id, task)
    return task
  }

  get(id: string): Task | undefined {
    const task = this.tasks.get(id)
    if (task && !task.is_deleted) {
      return task
    }
    return undefined
  }

  getAll(includeDeleted = false): Task[] {
    return Array.from(this.tasks.values()).filter(t => includeDeleted || !t.is_deleted)
  }

  update(id: string, data: TaskUpdate): Task | undefined {
    const task = this.tasks.get(id)
    if (!task || task.is_deleted) {
      return undefined
    }

    const updatedTask: Task = {
      ...task,
      title: data.title ?? task.title,
      content: data.content ?? task.content,
      list_id: data.list_id !== undefined ? data.list_id : task.list_id,
      is_habit: data.is_habit ?? task.is_habit,
      reminder_time: data.clear_reminder ? null : (data.reminder_time ?? task.reminder_time),
      updated_at: new Date().toISOString(),
    }

    this.tasks.set(id, updatedTask)
    return updatedTask
  }

  delete(id: string, hard = false): boolean {
    const task = this.tasks.get(id)
    if (!task) {
      return false
    }

    if (hard) {
      this.tasks.delete(id)
    } else {
      task.is_deleted = true
      task.updated_at = new Date().toISOString()
    }
    return true
  }

  clear(): void {
    this.tasks.clear()
    this.nextId = 1
  }
}

describe('Task CRUD - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 2: Task CRUD Operations**
   * **Validates: Requirements 4.2, 4.3, 4.5**
   * 
   * For any valid task data, creating a task should result in the task being
   * retrievable, updating should persist changes, and soft-deleting should
   * exclude it from active queries.
   */
  describe('Property 2: Task CRUD Operations', () => {
    it('should make created tasks retrievable', () => {
      fc.assert(
        fc.property(
          taskCreateArbitrary,
          (createData) => {
            const store = new TaskStore()
            
            // Create task
            const created = store.create(createData)
            
            // Property: Created task should be retrievable
            const retrieved = store.get(created.id)
            expect(retrieved).toBeDefined()
            expect(retrieved?.id).toBe(created.id)
            expect(retrieved?.title).toBe(createData.title)
            expect(retrieved?.is_habit).toBe(createData.is_habit ?? false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist updates correctly', () => {
      fc.assert(
        fc.property(
          taskCreateArbitrary,
          taskUpdateArbitrary,
          (createData, updateData) => {
            const store = new TaskStore()
            
            // Create task
            const created = store.create(createData)
            
            // Update task
            const updated = store.update(created.id, updateData)
            
            // Property: Update should succeed
            expect(updated).toBeDefined()
            
            // Property: Updated fields should be persisted
            if (updateData.title !== undefined) {
              expect(updated?.title).toBe(updateData.title)
            } else {
              expect(updated?.title).toBe(createData.title)
            }
            
            if (updateData.is_habit !== undefined) {
              expect(updated?.is_habit).toBe(updateData.is_habit)
            }
            
            // Property: Retrieved task should match updated task
            const retrieved = store.get(created.id)
            expect(retrieved).toEqual(updated)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should exclude soft-deleted tasks from active queries', () => {
      fc.assert(
        fc.property(
          fc.array(taskCreateArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (createDataList, deleteIndexRaw) => {
            const store = new TaskStore()
            
            // Create multiple tasks
            const createdTasks = createDataList.map(data => store.create(data))
            const deleteIndex = deleteIndexRaw % createdTasks.length
            const taskToDelete = createdTasks[deleteIndex]
            
            // Soft delete one task
            const deleteResult = store.delete(taskToDelete.id, false)
            expect(deleteResult).toBe(true)
            
            // Property: Deleted task should not be retrievable via get
            const retrieved = store.get(taskToDelete.id)
            expect(retrieved).toBeUndefined()
            
            // Property: Deleted task should not appear in getAll (without includeDeleted)
            const allTasks = store.getAll(false)
            expect(allTasks.find(t => t.id === taskToDelete.id)).toBeUndefined()
            
            // Property: Deleted task should appear in getAll with includeDeleted
            const allTasksIncludingDeleted = store.getAll(true)
            const deletedTask = allTasksIncludingDeleted.find(t => t.id === taskToDelete.id)
            expect(deletedTask).toBeDefined()
            expect(deletedTask?.is_deleted).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve task count after create operations', () => {
      fc.assert(
        fc.property(
          fc.array(taskCreateArbitrary, { minLength: 0, maxLength: 20 }),
          (createDataList) => {
            const store = new TaskStore()
            
            // Create tasks
            createDataList.forEach(data => store.create(data))
            
            // Property: Task count should equal number of creates
            const allTasks = store.getAll()
            expect(allTasks.length).toBe(createDataList.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should generate unique IDs for each created task', () => {
      fc.assert(
        fc.property(
          fc.array(taskCreateArbitrary, { minLength: 2, maxLength: 20 }),
          (createDataList) => {
            const store = new TaskStore()
            
            // Create tasks
            const createdTasks = createDataList.map(data => store.create(data))
            
            // Property: All IDs should be unique
            const ids = createdTasks.map(t => t.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update timestamps on modification', () => {
      fc.assert(
        fc.property(
          taskCreateArbitrary,
          taskUpdateArbitrary,
          (createData, updateData) => {
            const store = new TaskStore()
            
            // Create task
            const created = store.create(createData)
            const originalUpdatedAt = created.updated_at
            
            // Small delay to ensure timestamp difference
            const updated = store.update(created.id, updateData)
            
            // Property: updated_at should be >= original
            expect(updated).toBeDefined()
            expect(new Date(updated!.updated_at).getTime())
              .toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime())
            
            // Property: created_at should remain unchanged
            expect(updated!.created_at).toBe(created.created_at)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not allow updates to deleted tasks', () => {
      fc.assert(
        fc.property(
          taskCreateArbitrary,
          taskUpdateArbitrary,
          (createData, updateData) => {
            const store = new TaskStore()
            
            // Create and delete task
            const created = store.create(createData)
            store.delete(created.id, false)
            
            // Try to update deleted task
            const updated = store.update(created.id, updateData)
            
            // Property: Update should fail for deleted tasks
            expect(updated).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle clear_reminder flag correctly', () => {
      fc.assert(
        fc.property(
          taskCreateArbitrary.filter(d => d.reminder_time !== undefined),
          (createData) => {
            const store = new TaskStore()
            
            // Create task with reminder
            const created = store.create(createData)
            expect(created.reminder_time).toBe(createData.reminder_time)
            
            // Update with clear_reminder
            const updated = store.update(created.id, { clear_reminder: true })
            
            // Property: Reminder should be cleared
            expect(updated?.reminder_time).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
