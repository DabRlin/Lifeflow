/**
 * Property-based tests for Life Entry Edit Timestamp Preservation
 * **Feature: lifeflow-v2, Property 9: Life Entry Edit Timestamp Preservation**
 * **Validates: Requirements 6.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  simulateEdit,
  validateEditTimestamps,
  contentChanged,
} from './entry-edit'
import type { LifeEntry, LifeEntryUpdate } from '@/api/types'

// Helper to generate a valid ISO timestamp
const timestampArb = fc.integer({ min: 0, max: 365 * 5 }).map(days => {
  const baseDate = new Date('2020-01-01T12:00:00Z')
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString()
})

// Helper to generate a valid LifeEntry
const lifeEntryArb = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  created_at: timestampArb,
  updated_at: timestampArb,
  is_deleted: fc.constant(false),
})

// Helper to generate a valid LifeEntryUpdate
const lifeEntryUpdateArb = fc.record({
  content: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
})

describe('Life Entry Edit Timestamp Preservation - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 9: Life Entry Edit Timestamp Preservation**
   * **Validates: Requirements 6.4**
   * 
   * For any life entry edit operation, the createdAt timestamp should remain
   * unchanged while updatedAt is updated.
   */
  describe('Property 9: Life Entry Edit Timestamp Preservation', () => {
    it('should preserve created_at timestamp after edit', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          lifeEntryUpdateArb,
          timestampArb,
          (original, update, newUpdatedAt) => {
            const result = simulateEdit(original, update, newUpdatedAt)
            
            // created_at must be preserved
            expect(result.entry.created_at).toBe(original.created_at)
            expect(result.createdAtPreserved).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update updated_at timestamp after edit', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          lifeEntryUpdateArb,
          timestampArb,
          (original, update, newUpdatedAt) => {
            // Ensure new timestamp is different from original
            fc.pre(newUpdatedAt !== original.updated_at)
            
            const result = simulateEdit(original, update, newUpdatedAt)
            
            // updated_at should be changed to new timestamp
            expect(result.entry.updated_at).toBe(newUpdatedAt)
            expect(result.updatedAtChanged).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve entry ID after edit', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          lifeEntryUpdateArb,
          timestampArb,
          (original, update, newUpdatedAt) => {
            const result = simulateEdit(original, update, newUpdatedAt)
            
            // ID must never change
            expect(result.entry.id).toBe(original.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update content when provided', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          fc.string({ minLength: 1, maxLength: 500 }),
          timestampArb,
          (original, newContent, newUpdatedAt) => {
            const update: LifeEntryUpdate = { content: newContent }
            const result = simulateEdit(original, update, newUpdatedAt)
            
            // Content should be updated and trimmed
            expect(result.entry.content).toBe(newContent.trim())
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve content when not provided in update', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          timestampArb,
          (original, newUpdatedAt) => {
            const update: LifeEntryUpdate = {}
            const result = simulateEdit(original, update, newUpdatedAt)
            
            // Content should remain unchanged
            expect(result.entry.content).toBe(original.content)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate timestamps correctly for valid edits', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          fc.string({ minLength: 1, maxLength: 500 }),
          (original, newContent) => {
            // Create a valid updated entry with later timestamp
            const originalTime = new Date(original.updated_at).getTime()
            const newUpdatedAt = new Date(originalTime + 1000).toISOString()
            
            const update: LifeEntryUpdate = { content: newContent }
            const result = simulateEdit(original, update, newUpdatedAt)
            
            // Validation should pass
            expect(validateEditTimestamps(original, result.entry)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect invalid edits where created_at changed', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          timestampArb,
          (original, differentCreatedAt) => {
            // Ensure different timestamp
            fc.pre(differentCreatedAt !== original.created_at)
            
            // Create an invalid entry with changed created_at
            const invalidEntry: LifeEntry = {
              ...original,
              created_at: differentCreatedAt,
            }
            
            // Validation should fail
            expect(validateEditTimestamps(original, invalidEntry)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect invalid edits where updated_at went backwards', () => {
      fc.assert(
        fc.property(
          lifeEntryArb,
          (original) => {
            // Create an invalid entry with earlier updated_at
            const originalTime = new Date(original.updated_at).getTime()
            const earlierTime = new Date(originalTime - 1000).toISOString()
            
            const invalidEntry: LifeEntry = {
              ...original,
              updated_at: earlierTime,
            }
            
            // Validation should fail
            expect(validateEditTimestamps(original, invalidEntry)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Content Change Detection', () => {
    it('should detect when content changed', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          (original, updated) => {
            // Ensure different content after trimming
            fc.pre(original.trim() !== updated.trim())
            
            expect(contentChanged(original, updated)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not detect change for same content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (content) => {
            expect(contentChanged(content, content)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ignore whitespace differences', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => s.trim() === ''),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => s.trim() === ''),
          (content, prefix, suffix) => {
            const withWhitespace = prefix + content + suffix
            
            // Same content with different whitespace should not be detected as changed
            expect(contentChanged(content.trim(), withWhitespace)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
