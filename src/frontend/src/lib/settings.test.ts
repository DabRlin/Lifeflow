/**
 * Property-based tests for Settings Round-Trip Consistency
 * **Feature: lifeflow-v2, Property 12: Settings Round-Trip Consistency**
 * **Validates: Requirements 8.2**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  serializeSettings,
  deserializeSettings,
  validateSettings,
  mergeSettings,
  DEFAULT_SETTINGS,
  type Settings,
} from './settings'

// Arbitrary for valid theme values
const themeArb = fc.constantFrom('light', 'dark', 'system') as fc.Arbitrary<'light' | 'dark' | 'system'>

// Arbitrary for valid settings object
const settingsArb: fc.Arbitrary<Settings> = fc.record({
  notificationsEnabled: fc.boolean(),
  theme: themeArb,
  reminderTime: fc.option(
    fc.tuple(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 0, max: 59 })
    ).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`),
    { nil: null }
  ),
})

// Arbitrary for partial settings (for updates)
const partialSettingsArb: fc.Arbitrary<Partial<Settings>> = fc.record({
  notificationsEnabled: fc.option(fc.boolean(), { nil: undefined }),
  theme: fc.option(themeArb, { nil: undefined }),
  reminderTime: fc.option(
    fc.option(
      fc.tuple(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 })
      ).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`),
      { nil: null }
    ),
    { nil: undefined }
  ),
}).map(obj => {
  // Remove undefined values
  const result: Partial<Settings> = {}
  if (obj.notificationsEnabled !== undefined) result.notificationsEnabled = obj.notificationsEnabled
  if (obj.theme !== undefined) result.theme = obj.theme
  if (obj.reminderTime !== undefined) result.reminderTime = obj.reminderTime
  return result
})

describe('Settings Round-Trip - Property Tests', () => {
  /**
   * **Feature: lifeflow-v2, Property 12: Settings Round-Trip Consistency**
   * **Validates: Requirements 8.2**
   * 
   * For any valid settings object, saving and then loading should produce
   * an equivalent settings object.
   */
  describe('Property 12: Settings Round-Trip Consistency', () => {
    it('serializing then deserializing should produce equivalent settings', () => {
      fc.assert(
        fc.property(settingsArb, (settings) => {
          const serialized = serializeSettings(settings)
          const deserialized = deserializeSettings(serialized)
          
          expect(deserialized.notificationsEnabled).toBe(settings.notificationsEnabled)
          expect(deserialized.theme).toBe(settings.theme)
          expect(deserialized.reminderTime).toBe(settings.reminderTime)
        }),
        { numRuns: 100 }
      )
    })

    it('double serialization should be idempotent', () => {
      fc.assert(
        fc.property(settingsArb, (settings) => {
          const serialized1 = serializeSettings(settings)
          const deserialized1 = deserializeSettings(serialized1)
          const serialized2 = serializeSettings(deserialized1)
          
          expect(serialized1).toBe(serialized2)
        }),
        { numRuns: 100 }
      )
    })

    it('deserialized settings should always be valid', () => {
      fc.assert(
        fc.property(settingsArb, (settings) => {
          const serialized = serializeSettings(settings)
          const deserialized = deserializeSettings(serialized)
          
          expect(validateSettings(deserialized)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Settings Validation', () => {
    it('all generated settings should be valid', () => {
      fc.assert(
        fc.property(settingsArb, (settings) => {
          expect(validateSettings(settings)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('default settings should be valid', () => {
      expect(validateSettings(DEFAULT_SETTINGS)).toBe(true)
    })

    it('should reject invalid theme values', () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'invalid' as 'light' | 'dark' | 'system',
      }
      expect(validateSettings(invalidSettings)).toBe(false)
    })

    it('should reject invalid reminderTime format', () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        reminderTime: 'invalid-time',
      }
      expect(validateSettings(invalidSettings)).toBe(false)
    })
  })

  describe('Settings Merge', () => {
    it('merging with empty object should return original settings', () => {
      fc.assert(
        fc.property(settingsArb, (settings) => {
          const merged = mergeSettings(settings, {})
          
          expect(merged.notificationsEnabled).toBe(settings.notificationsEnabled)
          expect(merged.theme).toBe(settings.theme)
          expect(merged.reminderTime).toBe(settings.reminderTime)
        }),
        { numRuns: 100 }
      )
    })

    it('merging should apply partial updates correctly', () => {
      fc.assert(
        fc.property(settingsArb, partialSettingsArb, (base, updates) => {
          const merged = mergeSettings(base, updates)
          
          // Updated fields should have new values
          if (updates.notificationsEnabled !== undefined) {
            expect(merged.notificationsEnabled).toBe(updates.notificationsEnabled)
          } else {
            expect(merged.notificationsEnabled).toBe(base.notificationsEnabled)
          }
          
          if (updates.theme !== undefined) {
            expect(merged.theme).toBe(updates.theme)
          } else {
            expect(merged.theme).toBe(base.theme)
          }
          
          if (updates.reminderTime !== undefined) {
            expect(merged.reminderTime).toBe(updates.reminderTime)
          } else {
            expect(merged.reminderTime).toBe(base.reminderTime)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('merged settings should always be valid', () => {
      fc.assert(
        fc.property(settingsArb, partialSettingsArb, (base, updates) => {
          const merged = mergeSettings(base, updates)
          expect(validateSettings(merged)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('merge should be associative for sequential updates', () => {
      fc.assert(
        fc.property(
          settingsArb,
          partialSettingsArb,
          partialSettingsArb,
          (base, update1, update2) => {
            // Apply updates sequentially
            const sequential = mergeSettings(mergeSettings(base, update1), update2)
            
            // Apply combined updates
            const combined = mergeSettings(base, { ...update1, ...update2 })
            
            expect(sequential.notificationsEnabled).toBe(combined.notificationsEnabled)
            expect(sequential.theme).toBe(combined.theme)
            expect(sequential.reminderTime).toBe(combined.reminderTime)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle null reminderTime correctly', () => {
      const settings: Settings = {
        notificationsEnabled: true,
        theme: 'light',
        reminderTime: null,
      }
      
      const serialized = serializeSettings(settings)
      const deserialized = deserializeSettings(serialized)
      
      expect(deserialized.reminderTime).toBeNull()
    })

    it('should handle all theme values', () => {
      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
      
      for (const theme of themes) {
        const settings: Settings = {
          ...DEFAULT_SETTINGS,
          theme,
        }
        
        const serialized = serializeSettings(settings)
        const deserialized = deserializeSettings(serialized)
        
        expect(deserialized.theme).toBe(theme)
      }
    })

    it('should handle boundary time values', () => {
      const boundaryTimes = ['00:00', '23:59', '12:00', '06:30']
      
      for (const time of boundaryTimes) {
        const settings: Settings = {
          ...DEFAULT_SETTINGS,
          reminderTime: time,
        }
        
        const serialized = serializeSettings(settings)
        const deserialized = deserializeSettings(serialized)
        
        expect(deserialized.reminderTime).toBe(time)
      }
    })
  })
})
