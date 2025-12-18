/**
 * Property-based tests for Heatmap Data Aggregation
 * **Feature: lifeflow-v2, Property 6: Heatmap Data Aggregation**
 * **Validates: Requirements 5.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  aggregateCheckinsByDate,
  getCheckinCountForDate,
  getMaxCheckinCount,
  fillMissingDates,
  calculateIntensityLevel,
} from './heatmap'
import type { CheckinRecord } from '@/api/types'

// Helper to generate a valid date string in YYYY-MM-DD format
const dateArb = fc.integer({ min: 0, max: 365 }).map(days => {
  const baseDate = new Date('2024-01-01T00:00:00Z')
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString().split('T')[0]
})

// Helper to create a check-in record
function createCheckinRecord(date: string, taskId?: string): CheckinRecord {
  return {
    id: Math.random().toString(36).substring(7),
    task_id: taskId || Math.random().toString(36).substring(7),
    checkin_date: date,
    checkin_time: '12:00:00',
  }
}

describe('Heatmap Data Aggregation - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 6: Heatmap Data Aggregation**
   * **Validates: Requirements 5.4**
   * 
   * For any set of check-in records, the calendar heatmap should correctly
   * aggregate check-ins by date and display accurate intensity levels.
   */
  describe('Property 6: Heatmap Data Aggregation', () => {
    it('should return empty array for empty records', () => {
      const result = aggregateCheckinsByDate([])
      expect(result).toEqual([])
    })

    it('should correctly count check-ins per date', () => {
      fc.assert(
        fc.property(
          fc.array(dateArb, { minLength: 1, maxLength: 50 }),
          (dates) => {
            // Create records from dates
            const records = dates.map(date => createCheckinRecord(date))
            
            // Aggregate
            const aggregated = aggregateCheckinsByDate(records)
            
            // Total count should match number of records
            const totalCount = aggregated.reduce((sum, [, count]) => sum + count, 0)
            expect(totalCount).toBe(records.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should produce unique dates in aggregated result', () => {
      fc.assert(
        fc.property(
          fc.array(dateArb, { minLength: 1, maxLength: 50 }),
          (dates) => {
            const records = dates.map(date => createCheckinRecord(date))
            const aggregated = aggregateCheckinsByDate(records)
            
            // All dates should be unique
            const uniqueDates = new Set(aggregated.map(([date]) => date))
            expect(uniqueDates.size).toBe(aggregated.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sort results by date', () => {
      fc.assert(
        fc.property(
          fc.array(dateArb, { minLength: 2, maxLength: 50 }),
          (dates) => {
            const records = dates.map(date => createCheckinRecord(date))
            const aggregated = aggregateCheckinsByDate(records)
            
            // Check that dates are sorted
            for (let i = 1; i < aggregated.length; i++) {
              expect(aggregated[i][0] >= aggregated[i - 1][0]).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly aggregate multiple check-ins on same date', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 10 }),
          (date, count) => {
            // Create multiple records for the same date
            const records = Array(count)
              .fill(null)
              .map(() => createCheckinRecord(date))
            
            const aggregated = aggregateCheckinsByDate(records)
            
            // Should have exactly one entry with the correct count
            expect(aggregated.length).toBe(1)
            expect(aggregated[0][0]).toBe(date)
            expect(aggregated[0][1]).toBe(count)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getCheckinCountForDate', () => {
    it('should return 0 for dates with no check-ins', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.array(dateArb, { minLength: 0, maxLength: 20 }),
          (targetDate, otherDates) => {
            // Filter out target date from other dates
            const filteredDates = otherDates.filter(d => d !== targetDate)
            const records = filteredDates.map(date => createCheckinRecord(date))
            
            const count = getCheckinCountForDate(records, targetDate)
            expect(count).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return correct count for dates with check-ins', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 10 }),
          (targetDate, expectedCount) => {
            const records = Array(expectedCount)
              .fill(null)
              .map(() => createCheckinRecord(targetDate))
            
            const count = getCheckinCountForDate(records, targetDate)
            expect(count).toBe(expectedCount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getMaxCheckinCount', () => {
    it('should return 0 for empty records', () => {
      expect(getMaxCheckinCount([])).toBe(0)
    })

    it('should return the maximum count across all dates', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(dateArb, fc.integer({ min: 1, max: 10 })),
            { minLength: 1, maxLength: 10 }
          ),
          (dateCountPairs) => {
            // Create records based on date-count pairs
            const records: CheckinRecord[] = []
            let expectedMax = 0
            
            for (const [date, count] of dateCountPairs) {
              for (let i = 0; i < count; i++) {
                records.push(createCheckinRecord(date))
              }
              expectedMax = Math.max(expectedMax, count)
            }
            
            // Note: If same date appears multiple times in pairs, counts add up
            // So we need to recalculate expected max from aggregated data
            const aggregated = aggregateCheckinsByDate(records)
            const actualExpectedMax = Math.max(...aggregated.map(([, c]) => c))
            
            const maxCount = getMaxCheckinCount(records)
            expect(maxCount).toBe(actualExpectedMax)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('fillMissingDates', () => {
    it('should fill all dates in range with zeros for empty data', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 300 }),
          fc.integer({ min: 1, max: 30 }),
          (startOffset, rangeLength) => {
            const baseDate = new Date('2024-01-01T00:00:00Z')
            baseDate.setUTCDate(baseDate.getUTCDate() + startOffset)
            const startDate = baseDate.toISOString().split('T')[0]
            
            baseDate.setUTCDate(baseDate.getUTCDate() + rangeLength)
            const endDate = baseDate.toISOString().split('T')[0]
            
            const filled = fillMissingDates([], startDate, endDate)
            
            // Should have rangeLength + 1 entries (inclusive)
            expect(filled.length).toBe(rangeLength + 1)
            
            // All counts should be 0
            expect(filled.every(([, count]) => count === 0)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve existing counts when filling', () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.integer({ min: 1, max: 10 }),
          (date, count) => {
            const data: Array<[string, number]> = [[date, count]]
            
            // Create a range that includes the date
            const dateObj = new Date(date + 'T00:00:00Z')
            const startDate = new Date(dateObj)
            startDate.setUTCDate(startDate.getUTCDate() - 5)
            const endDate = new Date(dateObj)
            endDate.setUTCDate(endDate.getUTCDate() + 5)
            
            const filled = fillMissingDates(
              data,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            )
            
            // Find the original date in filled data
            const entry = filled.find(([d]) => d === date)
            expect(entry).toBeDefined()
            expect(entry![1]).toBe(count)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('calculateIntensityLevel', () => {
    it('should return 0 for zero count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (maxCount) => {
            expect(calculateIntensityLevel(0, maxCount)).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return value between 0 and 4', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (count, maxCount) => {
            const level = calculateIntensityLevel(count, maxCount)
            expect(level).toBeGreaterThanOrEqual(0)
            expect(level).toBeLessThanOrEqual(4)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 4 for maximum count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (maxCount) => {
            expect(calculateIntensityLevel(maxCount, maxCount)).toBe(4)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be monotonically increasing with count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          (maxCount) => {
            const levels = [0, 1, 2, 3, 4].map(i => 
              calculateIntensityLevel(Math.floor(maxCount * i / 4), maxCount)
            )
            
            // Each level should be >= previous level
            for (let i = 1; i < levels.length; i++) {
              expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1])
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
