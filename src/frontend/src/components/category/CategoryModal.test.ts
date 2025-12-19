/**
 * Property-based tests for CategoryModal
 * **Feature: category-list-management, Property 1: Category name validation**
 * **Validates: Requirements 1.3, 2.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateCategoryName } from './CategoryModal'

// Whitespace characters for generating whitespace-only strings
const whitespaceChars = [' ', '\t', '\n', '\r', '\f', '\v']

// Generator for whitespace-only strings (including empty string)
const whitespaceOnlyArbitrary = fc
  .array(fc.constantFrom(...whitespaceChars), { minLength: 0, maxLength: 50 })
  .map((chars) => chars.join(''))

// Generator for valid category names (non-empty, non-whitespace-only)
const validCategoryNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0)

describe('CategoryModal - Property Tests', () => {
  /**
   * **Feature: category-list-management, Property 1: Category name validation**
   * **Validates: Requirements 1.3, 2.3**
   *
   * For any string composed entirely of whitespace characters (including empty string),
   * attempting to create or update a category with that name should be rejected
   * with a validation error.
   */
  describe('Property 1: Category name validation', () => {
    it('whitespace-only names should be rejected', () => {
      fc.assert(
        fc.property(whitespaceOnlyArbitrary, (name: string) => {
          const error = validateCategoryName(name)

          // Property: Whitespace-only names should return an error
          expect(error).not.toBeNull()
          expect(typeof error).toBe('string')
        }),
        { numRuns: 100 }
      )
    })

    it('empty string should be rejected', () => {
      const error = validateCategoryName('')

      // Property: Empty string should return an error
      expect(error).not.toBeNull()
      expect(error).toBe('分类名称不能为空')
    })

    it('valid names should be accepted', () => {
      fc.assert(
        fc.property(validCategoryNameArbitrary, (name: string) => {
          const error = validateCategoryName(name)

          // Property: Valid names should not return an error
          expect(error).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    it('names with leading/trailing whitespace but non-empty content should be accepted', () => {
      // Generator for whitespace padding
      const whitespacePaddingArbitrary = fc
        .array(fc.constantFrom(' ', '\t'), { minLength: 0, maxLength: 5 })
        .map((chars) => chars.join(''))

      fc.assert(
        fc.property(
          fc.tuple(
            whitespacePaddingArbitrary,
            fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            whitespacePaddingArbitrary
          ),
          ([leadingWhitespace, content, trailingWhitespace]) => {
            const name = leadingWhitespace + content + trailingWhitespace
            const error = validateCategoryName(name)

            // Property: Names with non-empty trimmed content should be accepted
            expect(error).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validation should be deterministic', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 100 }), (name: string) => {
          const error1 = validateCategoryName(name)
          const error2 = validateCategoryName(name)

          // Property: Same input should always produce same output
          expect(error1).toBe(error2)
        }),
        { numRuns: 100 }
      )
    })

    it('validation result should be consistent with trim check', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 100 }), (name: string) => {
          const error = validateCategoryName(name)
          const trimmedLength = name.trim().length

          // Property: Error should be returned iff trimmed length is 0
          if (trimmedLength === 0) {
            expect(error).not.toBeNull()
          } else {
            expect(error).toBeNull()
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
