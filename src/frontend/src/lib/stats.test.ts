/**
 * Property-based tests for Statistics Calculation
 * **Feature: lifeflow-v2, Property 11: Statistics Calculation Accuracy**
 * **Validates: Requirements 7.1-7.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateStats,
  calculateCompletionRate,
  countCheckinsByDate,
  getUniqueCheckinDates,
  calculateTrendData,
  findLongestStreak,
  countActiveTasks,
  countHabitTasks,
} from './stats'
import type { Task, CheckinRecord } from '@/api/types'

// Arbitrary for generating valid date strings
const dateArb = fc.integer({ min: 0, max: 365 }).map((days) => {
  const baseDate = new Date('2024-01-01T00:00:00Z')
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString().split('T')[0]
})

// Arbitrary for generating task IDs
const taskIdArb = fc.uuid()

// Arbitrary for generating a task
const taskArb = fc.record({
  id: taskIdArb,
  title: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ maxLength: 200 }),
  list_id: fc.option(fc.uuid(), { nil: null }),
  is_habit: fc.boolean(),
  reminder_time: fc.constant(null),
  current_streak: fc.integer({ min: 0, max: 100 }),
  longest_streak: fc.integer({ min: 0, max: 365 }),
  last_checkin_date: fc.option(dateArb, { nil: null }),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
  is_deleted: fc.boolean(),
}) as fc.Arbitrary<Task>

// Arbitrary for generating a check-in record
const checkinRecordArb = (taskIds: string[]) =>
  fc.record({
    id: fc.uuid(),
    task_id: taskIds.length > 0 
      ? fc.constantFrom(...taskIds) 
      : fc.uuid(),
    checkin_date: dateArb,
    checkin_time: fc.constant('12:00:00'),
  }) as fc.Arbitrary<CheckinRecord>


describe('Statistics Calculation - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 11: Statistics Calculation Accuracy**
   * **Validates: Requirements 7.1-7.5**
   *
   * For any set of tasks and check-in records, the statistics
   * (total, completed, pending, completion rate, longest streak)
   * should be calculated correctly.
   */
  describe('Property 11: Statistics Calculation Accuracy', () => {
    it('total tasks should equal active (non-deleted) tasks count', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 50 }),
          dateArb,
          (tasks, todayDate) => {
            const stats = calculateStats(tasks, [], todayDate)
            const expectedTotal = tasks.filter((t) => !t.is_deleted).length
            expect(stats.totalTasks).toBe(expectedTotal)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('pending + completed should equal total tasks', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 50 }),
          dateArb,
          (tasks, todayDate) => {
            const taskIds = tasks.map((t) => t.id)
            const checkinArb = fc.array(checkinRecordArb(taskIds), {
              minLength: 0,
              maxLength: 20,
            })

            fc.assert(
              fc.property(checkinArb, (checkins) => {
                const stats = calculateStats(tasks, checkins, todayDate)
                expect(stats.pendingTasks + stats.completedTasks).toBe(
                  stats.totalTasks
                )
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 50 }
      )
    })

    it('completion rate should be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 50 }),
          dateArb,
          (tasks, todayDate) => {
            const taskIds = tasks.map((t) => t.id)
            const checkinArb = fc.array(checkinRecordArb(taskIds), {
              minLength: 0,
              maxLength: 20,
            })

            fc.assert(
              fc.property(checkinArb, (checkins) => {
                const stats = calculateStats(tasks, checkins, todayDate)
                expect(stats.completionRate).toBeGreaterThanOrEqual(0)
                expect(stats.completionRate).toBeLessThanOrEqual(100)
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 50 }
      )
    })

    it('completion rate should be 0 when no tasks exist', () => {
      fc.assert(
        fc.property(dateArb, (todayDate) => {
          const stats = calculateStats([], [], todayDate)
          expect(stats.completionRate).toBe(0)
          expect(stats.totalTasks).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('longest streak should be non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 50 }),
          dateArb,
          (tasks, todayDate) => {
            const stats = calculateStats(tasks, [], todayDate)
            expect(stats.longestStreak).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('today checkins should count only records with today date', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 1, maxLength: 20 }),
          dateArb,
          (tasks, todayDate) => {
            const taskIds = tasks.map((t) => t.id)
            
            // Generate some check-ins for today and some for other dates
            const todayCheckins = taskIds.slice(0, Math.min(3, taskIds.length)).map((id) => ({
              id: crypto.randomUUID(),
              task_id: id,
              checkin_date: todayDate,
              checkin_time: '12:00:00',
            }))
            
            const otherDate = '2020-01-01'
            const otherCheckins = taskIds.slice(0, Math.min(2, taskIds.length)).map((id) => ({
              id: crypto.randomUUID(),
              task_id: id,
              checkin_date: otherDate,
              checkin_time: '12:00:00',
            }))
            
            const allCheckins = [...todayCheckins, ...otherCheckins]
            const stats = calculateStats(tasks, allCheckins, todayDate)
            
            expect(stats.todayCheckins).toBe(todayCheckins.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Completion Rate Calculation', () => {
    it('should return 0 when total is 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (completed) => {
          expect(calculateCompletionRate(completed, 0)).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should return 0 when completed is negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }),
          fc.integer({ min: 1, max: 100 }),
          (completed, total) => {
            expect(calculateCompletionRate(completed, total)).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 100 when completed exceeds total', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (total) => {
            const completed = total + 10
            expect(calculateCompletionRate(completed, total)).toBe(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return correct percentage for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (completed, total) => {
            if (completed > total) return // Skip invalid cases
            
            const rate = calculateCompletionRate(completed, total)
            const expected = Math.round((completed / total) * 100)
            expect(rate).toBe(expected)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Check-in Counting', () => {
    it('should count check-ins for specific date correctly', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 0, max: 20 }),
          (targetDate, targetCount, otherCount) => {
            const targetCheckins: CheckinRecord[] = Array.from(
              { length: targetCount },
              () => ({
                id: crypto.randomUUID(),
                task_id: crypto.randomUUID(),
                checkin_date: targetDate,
                checkin_time: '12:00:00',
              })
            )
            
            const otherDate = '2020-01-01'
            const otherCheckins: CheckinRecord[] = Array.from(
              { length: otherCount },
              () => ({
                id: crypto.randomUUID(),
                task_id: crypto.randomUUID(),
                checkin_date: otherDate,
                checkin_time: '12:00:00',
              })
            )
            
            const allCheckins = [...targetCheckins, ...otherCheckins]
            const count = countCheckinsByDate(allCheckins, targetDate)
            
            expect(count).toBe(targetCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return unique dates sorted', () => {
      fc.assert(
        fc.property(
          fc.array(dateArb, { minLength: 0, maxLength: 30 }),
          (dates) => {
            const checkins: CheckinRecord[] = dates.map((date) => ({
              id: crypto.randomUUID(),
              task_id: crypto.randomUUID(),
              checkin_date: date,
              checkin_time: '12:00:00',
            }))
            
            const uniqueDates = getUniqueCheckinDates(checkins)
            
            // Should be unique
            expect(uniqueDates.length).toBe(new Set(dates).size)
            
            // Should be sorted
            for (let i = 1; i < uniqueDates.length; i++) {
              expect(uniqueDates[i] >= uniqueDates[i - 1]).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Trend Data Calculation', () => {
    it('should return correct number of days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          dateArb,
          (days, endDate) => {
            const trend = calculateTrendData([], days, endDate)
            expect(trend.length).toBe(days)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should end with the specified end date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          dateArb,
          (days, endDate) => {
            const trend = calculateTrendData([], days, endDate)
            expect(trend[trend.length - 1].date).toBe(endDate)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have consecutive dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 30 }),
          dateArb,
          (days, endDate) => {
            const trend = calculateTrendData([], days, endDate)
            
            for (let i = 1; i < trend.length; i++) {
              const prevDate = new Date(trend[i - 1].date + 'T00:00:00Z')
              const currDate = new Date(trend[i].date + 'T00:00:00Z')
              const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
              expect(diffDays).toBe(1)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Task Counting Utilities', () => {
    it('findLongestStreak should return max longest_streak from tasks', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 1, maxLength: 50 }),
          (tasks) => {
            const result = findLongestStreak(tasks)
            const expected = Math.max(...tasks.map((t) => t.longest_streak || 0))
            expect(result).toBe(expected)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('findLongestStreak should return 0 for empty array', () => {
      expect(findLongestStreak([])).toBe(0)
    })

    it('countActiveTasks should exclude deleted tasks', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 50 }),
          (tasks) => {
            const result = countActiveTasks(tasks)
            const expected = tasks.filter((t) => !t.is_deleted).length
            expect(result).toBe(expected)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('countHabitTasks should count only active habit tasks', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 50 }),
          (tasks) => {
            const result = countHabitTasks(tasks)
            const expected = tasks.filter((t) => !t.is_deleted && t.is_habit).length
            expect(result).toBe(expected)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
