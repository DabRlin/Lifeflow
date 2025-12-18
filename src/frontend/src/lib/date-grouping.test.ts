/**
 * Property-based tests for Life Entry Date Grouping
 * **Feature: lifeflow-v2, Property 7: Life Entry Date Grouping**
 * **Validates: Requirements 6.1, 6.6**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { groupEntriesByDate } from '@/components/life/Timeline'
import { getDateString } from '@/lib/relative-time'
import type { LifeEntry } from '@/api/types'

// Helper to generate a valid date string in YYYY-MM-DD format
const dateArb = fc.integer({ min: 0, max: 365 }).map(days => {
  const baseDate = new Date('2024-01-01T00:00:00Z')
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString()
})

// Helper to generate a valid LifeEntry
const lifeEntryArb = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  created_at: dateArb,
  updated_at: dateArb,
  is_deleted: fc.constant(false),
})

// Helper to generate multiple entries
const lifeEntriesArb = fc.array(lifeEntryArb, { minLength: 0, maxLength: 50 })

describe('Life Entry Date Grouping - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 7: Life Entry Date Grouping**
   * **Validates: Requirements 6.1, 6.6**
   * 
   * For any set of life entries with different timestamps, entries should be
   * correctly grouped by date (based on createdAt) and ordered within groups.
   */
  describe('Property 7: Life Entry Date Grouping', () => {
    it('should return empty array for empty entries', () => {
      const groups = groupEntriesByDate([])
      expect(groups).toEqual([])
    })

    it('should group all entries by their creation date', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // Count total entries in groups
          const totalInGroups = groups.reduce((sum, g) => sum + g.entries.length, 0)
          
          // Total entries in groups should equal input entries
          expect(totalInGroups).toBe(entries.length)
        }),
        { numRuns: 100 }
      )
    })

    it('should ensure each entry appears in exactly one group', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // Collect all entry IDs from groups
          const entryIdsInGroups = new Set<string>()
          for (const group of groups) {
            for (const entry of group.entries) {
              // Each entry should appear only once
              expect(entryIdsInGroups.has(entry.id)).toBe(false)
              entryIdsInGroups.add(entry.id)
            }
          }
          
          // All original entries should be in groups
          for (const entry of entries) {
            expect(entryIdsInGroups.has(entry.id)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should group entries with same date together', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // For each group, all entries should have the same date
          for (const group of groups) {
            for (const entry of group.entries) {
              const entryDate = getDateString(new Date(entry.created_at))
              expect(entryDate).toBe(group.date)
            }
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should sort groups by date in descending order (newest first)', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // Groups should be sorted by date descending
          for (let i = 1; i < groups.length; i++) {
            const prevDate = groups[i - 1].date
            const currDate = groups[i].date
            expect(prevDate >= currDate).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should sort entries within each group by created_at descending', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // Entries within each group should be sorted by created_at descending
          for (const group of groups) {
            for (let i = 1; i < group.entries.length; i++) {
              const prevTime = new Date(group.entries[i - 1].created_at).getTime()
              const currTime = new Date(group.entries[i].created_at).getTime()
              expect(prevTime >= currTime).toBe(true)
            }
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should create unique groups for each distinct date', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // Get unique dates from original entries
          const uniqueDates = new Set(
            entries.map(e => getDateString(new Date(e.created_at)))
          )
          
          // Number of groups should equal number of unique dates
          expect(groups.length).toBe(uniqueDates.size)
          
          // Each group date should be unique
          const groupDates = new Set(groups.map(g => g.date))
          expect(groupDates.size).toBe(groups.length)
        }),
        { numRuns: 100 }
      )
    })

    it('should preserve entry content and metadata', () => {
      fc.assert(
        fc.property(lifeEntriesArb, (entries) => {
          const groups = groupEntriesByDate(entries)
          
          // Create a map of original entries by ID
          const originalMap = new Map(entries.map(e => [e.id, e]))
          
          // Verify each entry in groups matches original
          for (const group of groups) {
            for (const entry of group.entries) {
              const original = originalMap.get(entry.id)
              expect(original).toBeDefined()
              expect(entry.content).toBe(original!.content)
              expect(entry.created_at).toBe(original!.created_at)
              expect(entry.updated_at).toBe(original!.updated_at)
            }
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should handle entries with same timestamp correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          dateArb,
          (content1, content2, timestamp) => {
            const entries: LifeEntry[] = [
              {
                id: 'entry-1',
                content: content1,
                created_at: timestamp,
                updated_at: timestamp,
                is_deleted: false,
              },
              {
                id: 'entry-2',
                content: content2,
                created_at: timestamp,
                updated_at: timestamp,
                is_deleted: false,
              },
            ]
            
            const groups = groupEntriesByDate(entries)
            
            // Should have exactly one group
            expect(groups.length).toBe(1)
            // Group should contain both entries
            expect(groups[0].entries.length).toBe(2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
