/**
 * Property-based tests for Relative Time Formatting
 * **Feature: lifeflow-v2, Property 10: Relative Time Formatting**
 * **Validates: Requirements 6.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import {
  formatRelativeTime,
  formatFullDate,
  isSameDay,
  getDateString,
} from './relative-time'

describe('Relative Time Formatting - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 10: Relative Time Formatting**
   * **Validates: Requirements 6.5**
   * 
   * For any timestamp, the relative time format should correctly represent
   * the time difference (e.g., "2 小时前", "昨天", "3 天前").
   */
  describe('Property 10: Relative Time Formatting', () => {
    // Use a fixed "now" time for deterministic tests
    const fixedNow = new Date('2024-06-15T12:00:00Z')
    
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(fixedNow)
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "刚刚" for timestamps less than 1 minute ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 59 }),
          (secondsAgo) => {
            const timestamp = new Date(fixedNow.getTime() - secondsAgo * 1000)
            const result = formatRelativeTime(timestamp)
            expect(result).toBe('刚刚')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return "X 分钟前" for timestamps 1-59 minutes ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 59 }),
          (minutesAgo) => {
            const timestamp = new Date(fixedNow.getTime() - minutesAgo * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            expect(result).toBe(`${minutesAgo} 分钟前`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return "X 小时前" for timestamps 1-23 hours ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 23 }),
          (hoursAgo) => {
            const timestamp = new Date(fixedNow.getTime() - hoursAgo * 60 * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            expect(result).toBe(`${hoursAgo} 小时前`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return "昨天" for timestamps exactly 1 day ago', () => {
      const timestamp = new Date(fixedNow.getTime() - 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(timestamp)
      expect(result).toBe('昨天')
    })

    it('should return "X 天前" for timestamps 2-6 days ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }),
          (daysAgo) => {
            const timestamp = new Date(fixedNow.getTime() - daysAgo * 24 * 60 * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            expect(result).toBe(`${daysAgo} 天前`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return "X 周前" for timestamps 7-29 days ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 7, max: 29 }),
          (daysAgo) => {
            const timestamp = new Date(fixedNow.getTime() - daysAgo * 24 * 60 * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            const expectedWeeks = Math.floor(daysAgo / 7)
            expect(result).toBe(`${expectedWeeks} 周前`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return "X 个月前" for timestamps 30-364 days ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 30, max: 364 }),
          (daysAgo) => {
            const timestamp = new Date(fixedNow.getTime() - daysAgo * 24 * 60 * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            const expectedMonths = Math.floor(daysAgo / 30)
            expect(result).toBe(`${expectedMonths} 个月前`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return "X 年前" for timestamps 365+ days ago', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 365, max: 1825 }), // 1-5 years
          (daysAgo) => {
            const timestamp = new Date(fixedNow.getTime() - daysAgo * 24 * 60 * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            const expectedYears = Math.floor(daysAgo / 365)
            expect(result).toBe(`${expectedYears} 年前`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle string timestamps correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 59 }),
          (minutesAgo) => {
            const timestamp = new Date(fixedNow.getTime() - minutesAgo * 60 * 1000)
            const isoString = timestamp.toISOString()
            
            const resultFromDate = formatRelativeTime(timestamp)
            const resultFromString = formatRelativeTime(isoString)
            
            expect(resultFromString).toBe(resultFromDate)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should always return a non-empty string', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3650 }), // 0-10 years
          (daysAgo) => {
            const timestamp = new Date(fixedNow.getTime() - daysAgo * 24 * 60 * 60 * 1000)
            const result = formatRelativeTime(timestamp)
            
            expect(result).toBeTruthy()
            expect(result.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('formatFullDate', () => {
    it('should return a formatted date string', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 * 5 }),
          (daysOffset) => {
            const baseDate = new Date('2020-01-01T12:00:00Z')
            baseDate.setUTCDate(baseDate.getUTCDate() + daysOffset)
            
            const result = formatFullDate(baseDate)
            
            // Should contain year, month, day
            expect(result).toBeTruthy()
            expect(result.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle string timestamps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (daysOffset) => {
            const baseDate = new Date('2020-01-01T12:00:00Z')
            baseDate.setUTCDate(baseDate.getUTCDate() + daysOffset)
            const isoString = baseDate.toISOString()
            
            const resultFromDate = formatFullDate(baseDate)
            const resultFromString = formatFullDate(isoString)
            
            expect(resultFromString).toBe(resultFromDate)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 23 }),
          (dayOffset, hour1, hour2) => {
            // Use local time to match isSameDay implementation
            const baseDate = new Date(2020, 0, 1, 12, 0, 0) // Jan 1, 2020, noon local time
            baseDate.setDate(baseDate.getDate() + dayOffset)
            
            const date1 = new Date(baseDate)
            date1.setHours(hour1, 0, 0, 0)
            
            const date2 = new Date(baseDate)
            date2.setHours(hour2, 0, 0, 0)
            
            expect(isSameDay(date1, date2)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return false for different days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          fc.integer({ min: 1, max: 30 }),
          (dayOffset, dayDiff) => {
            // Use local time to match isSameDay implementation
            const baseDate = new Date(2020, 0, 1, 12, 0, 0)
            baseDate.setDate(baseDate.getDate() + dayOffset)
            
            const date1 = new Date(baseDate)
            const date2 = new Date(baseDate)
            date2.setDate(date2.getDate() + dayDiff)
            
            expect(isSameDay(date1, date2)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getDateString', () => {
    it('should return YYYY-MM-DD format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 * 5 }),
          (daysOffset) => {
            const baseDate = new Date('2020-01-01T12:00:00Z')
            baseDate.setUTCDate(baseDate.getUTCDate() + daysOffset)
            
            const result = getDateString(baseDate)
            
            // Should match YYYY-MM-DD format
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be consistent for same date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 23 }),
          (dayOffset, hour1, hour2) => {
            const baseDate = new Date('2020-01-01T00:00:00Z')
            baseDate.setUTCDate(baseDate.getUTCDate() + dayOffset)
            
            const date1 = new Date(baseDate)
            date1.setHours(hour1)
            
            const date2 = new Date(baseDate)
            date2.setHours(hour2)
            
            // Same day should produce same date string
            expect(getDateString(date1)).toBe(getDateString(date2))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should produce different strings for different dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          fc.integer({ min: 1, max: 30 }),
          (dayOffset, dayDiff) => {
            const baseDate = new Date('2020-01-01T12:00:00Z')
            baseDate.setUTCDate(baseDate.getUTCDate() + dayOffset)
            
            const date1 = new Date(baseDate)
            const date2 = new Date(baseDate)
            date2.setDate(date2.getDate() + dayDiff)
            
            expect(getDateString(date1)).not.toBe(getDateString(date2))
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
