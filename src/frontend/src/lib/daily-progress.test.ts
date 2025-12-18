/**
 * Property-based tests for Daily Progress Calculation
 * **Feature: lifeflow-v2, Property 5: Daily Progress Calculation**
 * **Validates: Requirements 5.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDailyProgress,
  isHabitCompletedForDate,
  getIncompleteHabits,
  getCompletedHabits,
} from './daily-progress'
import type { Task } from '@/api/types'

// Helper to generate a valid date string in YYYY-MM-DD format
const dateArb = fc.integer({ min: 0, max: 365 }).map(days => {
  const baseDate = new Date('2024-01-01T00:00:00Z')
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString().split('T')[0]
})

// Helper to create a habit task
function createHabitTask(targetDate: string, isCompleted: boolean, isDeleted = false): Task {
  return {
    id: Math.random().toString(36).substring(7),
    title: 'Test Habit',
    content: '',
    list_id: null,
    is_habit: true,
    reminder_time: null,
    current_streak: 0,
    longest_streak: 0,
    last_checkin_date: isCompleted ? targetDate : null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: isDeleted,
  }
}

// Helper to create a non-habit task
function createNonHabitTask(): Task {
  return {
    id: Math.random().toString(36).substring(7),
    title: 'Test Task',
    content: '',
    list_id: null,
    is_habit: false,
    reminder_time: null,
    current_streak: 0,
    longest_streak: 0,
    last_checkin_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
  }
}

describe('Daily Progress Calculation - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 5: Daily Progress Calculation**
   * **Validates: Requirements 5.3**
   * 
   * For any set of habit tasks and their check-in status, the daily progress
   * percentage should equal (completed / total) * 100, with proper handling
   * of zero habits.
   */
  describe('Property 5: Daily Progress Calculation', () => {
    it('should return 0 for empty habits array', () => {
      fc.assert(
        fc.property(dateArb, (targetDate) => {
          const result = calculateDailyProgress([], targetDate)
          expect(result.total).toBe(0)
          expect(result.completed).toBe(0)
          expect(result.percentage).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should calculate correct percentage for any combination of completed/incomplete habits', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 0, max: 20 }),
          (targetDate, completedCount, incompleteCount) => {
            // Generate completed habits
            const completedHabits = Array(completedCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true))
            
            // Generate incomplete habits
            const incompleteHabits = Array(incompleteCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, false))
            
            const allHabits = [...completedHabits, ...incompleteHabits]
            const result = calculateDailyProgress(allHabits, targetDate)
            
            const expectedTotal = completedCount + incompleteCount
            const expectedPercentage = expectedTotal > 0
              ? Math.round((completedCount / expectedTotal) * 100)
              : 0
            
            expect(result.total).toBe(expectedTotal)
            expect(result.completed).toBe(completedCount)
            expect(result.percentage).toBe(expectedPercentage)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ignore non-habit tasks', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (targetDate, habitCount, nonHabitCount) => {
            // Generate habit tasks
            const habits = Array(habitCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true))
            
            // Generate non-habit tasks
            const nonHabits = Array(nonHabitCount)
              .fill(null)
              .map(() => createNonHabitTask())
            
            const allTasks = [...habits, ...nonHabits]
            const result = calculateDailyProgress(allTasks, targetDate)
            
            // Should only count habit tasks
            expect(result.total).toBe(habitCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ignore deleted habit tasks', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (targetDate, activeCount, deletedCount) => {
            // Generate active habit tasks
            const activeHabits = Array(activeCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true, false))
            
            // Generate deleted habit tasks
            const deletedHabits = Array(deletedCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true, true))
            
            const allTasks = [...activeHabits, ...deletedHabits]
            const result = calculateDailyProgress(allTasks, targetDate)
            
            // Should only count active habit tasks
            expect(result.total).toBe(activeCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 100% when all habits are completed', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 20 }),
          (targetDate, habitCount) => {
            const habits = Array(habitCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true))
            
            const result = calculateDailyProgress(habits, targetDate)
            
            expect(result.percentage).toBe(100)
            expect(result.completed).toBe(result.total)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0% when no habits are completed', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 20 }),
          (targetDate, habitCount) => {
            const habits = Array(habitCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, false))
            
            const result = calculateDailyProgress(habits, targetDate)
            
            expect(result.percentage).toBe(0)
            expect(result.completed).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Helper Functions', () => {
    it('isHabitCompletedForDate should correctly identify completed habits', () => {
      fc.assert(
        fc.property(dateArb, (targetDate) => {
          const completedHabit = createHabitTask(targetDate, true)
          const incompleteHabit = createHabitTask(targetDate, false)
          
          expect(isHabitCompletedForDate(completedHabit, targetDate)).toBe(true)
          expect(isHabitCompletedForDate(incompleteHabit, targetDate)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('getIncompleteHabits should return only incomplete habits', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (targetDate, completedCount, incompleteCount) => {
            const completedHabits = Array(completedCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true))
            
            const incompleteHabits = Array(incompleteCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, false))
            
            const allHabits = [...completedHabits, ...incompleteHabits]
            const result = getIncompleteHabits(allHabits, targetDate)
            
            expect(result.length).toBe(incompleteCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getCompletedHabits should return only completed habits', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (targetDate, completedCount, incompleteCount) => {
            const completedHabits = Array(completedCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true))
            
            const incompleteHabits = Array(incompleteCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, false))
            
            const allHabits = [...completedHabits, ...incompleteHabits]
            const result = getCompletedHabits(allHabits, targetDate)
            
            expect(result.length).toBe(completedCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('completed + incomplete should equal total', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (targetDate, completedCount, incompleteCount) => {
            const completedHabits = Array(completedCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, true))
            
            const incompleteHabits = Array(incompleteCount)
              .fill(null)
              .map(() => createHabitTask(targetDate, false))
            
            const allHabits = [...completedHabits, ...incompleteHabits]
            const completed = getCompletedHabits(allHabits, targetDate)
            const incomplete = getIncompleteHabits(allHabits, targetDate)
            
            expect(completed.length + incomplete.length).toBe(allHabits.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
