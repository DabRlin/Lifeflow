/**
 * Property-based tests for Streak Calculation
 * **Feature: lifeflow-v2, Property 4: Streak Calculation Correctness**
 * **Validates: Requirements 5.1, 5.2, 5.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateStreak,
  calculateLongestStreak,
  isDateCheckedIn,
  getPreviousDay,
  getNextDay,
  getDaysDifference,
  generateConsecutiveDates,
} from './streak'

// Helper to generate a valid date string in YYYY-MM-DD format
const dateArb = fc.integer({ min: 0, max: 3650 }).map(days => {
  const baseDate = new Date('2020-01-01T00:00:00Z')
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString().split('T')[0]
})

// Helper to generate consecutive dates
const consecutiveDatesArb = (maxLength: number) =>
  fc.tuple(dateArb, fc.integer({ min: 1, max: maxLength }))
    .map(([startDate, count]) => generateConsecutiveDates(startDate, count))

describe('Streak Calculation - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 4: Streak Calculation Correctness**
   * **Validates: Requirements 5.1, 5.2, 5.5**
   * 
   * For any sequence of check-in dates, the streak should correctly count
   * consecutive days, reset on gaps, and use the user's timezone for day boundaries.
   */
  describe('Property 4: Streak Calculation Correctness', () => {
    it('should return 0 for empty check-in dates', () => {
      fc.assert(
        fc.property(dateArb, (referenceDate) => {
          const streak = calculateStreak([], referenceDate)
          expect(streak).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should return correct streak for consecutive days ending on reference date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          dateArb,
          (streakLength, endDate) => {
            // Generate consecutive dates ending on endDate
            const dates: string[] = []
            let currentDate = endDate
            for (let i = 0; i < streakLength; i++) {
              dates.unshift(currentDate)
              currentDate = getPreviousDay(currentDate)
            }
            
            const streak = calculateStreak(dates, endDate)
            expect(streak).toBe(streakLength)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return correct streak for consecutive days ending yesterday', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          dateArb,
          (streakLength, referenceDate) => {
            const yesterday = getPreviousDay(referenceDate)
            
            // Generate consecutive dates ending on yesterday
            const dates: string[] = []
            let currentDate = yesterday
            for (let i = 0; i < streakLength; i++) {
              dates.unshift(currentDate)
              currentDate = getPreviousDay(currentDate)
            }
            
            const streak = calculateStreak(dates, referenceDate)
            expect(streak).toBe(streakLength)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0 when most recent check-in is more than 1 day ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 30 }),
          dateArb,
          fc.integer({ min: 1, max: 10 }),
          (daysAgo, referenceDate, streakLength) => {
            // Generate dates that end daysAgo before reference
            let endDate = referenceDate
            for (let i = 0; i < daysAgo; i++) {
              endDate = getPreviousDay(endDate)
            }
            
            const dates: string[] = []
            let currentDate = endDate
            for (let i = 0; i < streakLength; i++) {
              dates.unshift(currentDate)
              currentDate = getPreviousDay(currentDate)
            }
            
            const streak = calculateStreak(dates, referenceDate)
            expect(streak).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle gaps in check-in dates correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          dateArb,
          (recentStreak, gapDays, oldStreak, referenceDate) => {
            // Create recent consecutive dates
            const recentDates: string[] = []
            let currentDate = referenceDate
            for (let i = 0; i < recentStreak; i++) {
              recentDates.unshift(currentDate)
              currentDate = getPreviousDay(currentDate)
            }
            
            // Skip gap days
            for (let i = 0; i < gapDays; i++) {
              currentDate = getPreviousDay(currentDate)
            }
            
            // Create old consecutive dates
            const oldDates: string[] = []
            for (let i = 0; i < oldStreak; i++) {
              oldDates.unshift(currentDate)
              currentDate = getPreviousDay(currentDate)
            }
            
            const allDates = [...oldDates, ...recentDates]
            const streak = calculateStreak(allDates, referenceDate)
            
            // Streak should only count the recent consecutive days
            expect(streak).toBe(recentStreak)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle duplicate dates correctly', () => {
      fc.assert(
        fc.property(
          consecutiveDatesArb(10),
          fc.integer({ min: 1, max: 5 }),
          (dates, duplicateCount) => {
            if (dates.length === 0) return
            
            // Add duplicates of random dates
            const datesWithDuplicates = [...dates]
            for (let i = 0; i < duplicateCount; i++) {
              const randomIndex = Math.floor(Math.random() * dates.length)
              datesWithDuplicates.push(dates[randomIndex])
            }
            
            const referenceDate = dates[dates.length - 1]
            const streakWithDuplicates = calculateStreak(datesWithDuplicates, referenceDate)
            const streakWithoutDuplicates = calculateStreak(dates, referenceDate)
            
            // Duplicates should not affect streak count
            expect(streakWithDuplicates).toBe(streakWithoutDuplicates)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle unsorted dates correctly', () => {
      fc.assert(
        fc.property(
          consecutiveDatesArb(10),
          (dates) => {
            if (dates.length === 0) return
            
            const referenceDate = dates[dates.length - 1]
            
            // Shuffle dates
            const shuffledDates = [...dates].sort(() => Math.random() - 0.5)
            
            const streakSorted = calculateStreak(dates, referenceDate)
            const streakShuffled = calculateStreak(shuffledDates, referenceDate)
            
            // Order should not affect result
            expect(streakShuffled).toBe(streakSorted)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Longest Streak Calculation', () => {
    it('should return 0 for empty dates', () => {
      expect(calculateLongestStreak([])).toBe(0)
    })

    it('should return correct longest streak for consecutive dates', () => {
      fc.assert(
        fc.property(
          consecutiveDatesArb(30),
          (dates) => {
            const longest = calculateLongestStreak(dates)
            expect(longest).toBe(dates.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should find longest streak among multiple streaks', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          dateArb,
          (streak1Length, gapDays, streak2Length, startDate) => {
            // Create first streak
            const streak1 = generateConsecutiveDates(startDate, streak1Length)
            
            // Calculate start of second streak after gap
            let gapStart = streak1[streak1.length - 1]
            for (let i = 0; i <= gapDays; i++) {
              gapStart = getNextDay(gapStart)
            }
            
            // Create second streak
            const streak2 = generateConsecutiveDates(gapStart, streak2Length)
            
            const allDates = [...streak1, ...streak2]
            const longest = calculateLongestStreak(allDates)
            
            expect(longest).toBe(Math.max(streak1Length, streak2Length))
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Date Utility Functions', () => {
    it('getPreviousDay and getNextDay should be inverses', () => {
      fc.assert(
        fc.property(dateArb, (date) => {
          const prev = getPreviousDay(date)
          const next = getNextDay(prev)
          expect(next).toBe(date)
        }),
        { numRuns: 100 }
      )
    })

    it('getDaysDifference should be consistent with consecutive dates', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 0, max: 100 }),
          (startDate, days) => {
            let endDate = startDate
            for (let i = 0; i < days; i++) {
              endDate = getNextDay(endDate)
            }
            
            const diff = getDaysDifference(startDate, endDate)
            expect(diff).toBe(days)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('isDateCheckedIn should correctly identify checked dates', () => {
      fc.assert(
        fc.property(
          fc.array(dateArb, { minLength: 1, maxLength: 30 }),
          (dates) => {
            const uniqueDates = [...new Set(dates)]
            
            // All dates in the array should be checked in
            for (const date of uniqueDates) {
              expect(isDateCheckedIn(dates, date)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('generateConsecutiveDates should produce correct number of consecutive dates', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 30 }),
          (startDate, count) => {
            const dates = generateConsecutiveDates(startDate, count)
            
            expect(dates.length).toBe(count)
            expect(dates[0]).toBe(startDate)
            
            // Verify consecutiveness
            for (let i = 1; i < dates.length; i++) {
              const diff = getDaysDifference(dates[i - 1], dates[i])
              expect(diff).toBe(1)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
