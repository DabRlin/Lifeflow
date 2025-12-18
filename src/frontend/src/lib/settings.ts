/**
 * Settings utility functions for serialization, validation, and merging
 * **Feature: lifeflow-v2, Property 12: Settings Round-Trip Consistency**
 * **Validates: Requirements 8.2**
 */

/**
 * Settings type definition
 */
export interface Settings {
  notificationsEnabled: boolean
  theme: 'light' | 'dark' | 'system'
  reminderTime: string | null
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  theme: 'system',
  reminderTime: null,
}

/**
 * Valid theme values
 */
const VALID_THEMES = ['light', 'dark', 'system'] as const

/**
 * Time format regex (HH:MM)
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * Serialize settings to JSON string
 * @param settings - Settings object to serialize
 * @returns JSON string representation
 */
export function serializeSettings(settings: Settings): string {
  return JSON.stringify({
    notificationsEnabled: settings.notificationsEnabled,
    theme: settings.theme,
    reminderTime: settings.reminderTime,
  })
}

/**
 * Deserialize settings from JSON string
 * @param json - JSON string to deserialize
 * @returns Settings object
 */
export function deserializeSettings(json: string): Settings {
  try {
    const parsed = JSON.parse(json)
    
    return {
      notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' 
        ? parsed.notificationsEnabled 
        : DEFAULT_SETTINGS.notificationsEnabled,
      theme: VALID_THEMES.includes(parsed.theme) 
        ? parsed.theme 
        : DEFAULT_SETTINGS.theme,
      reminderTime: parsed.reminderTime === null || (typeof parsed.reminderTime === 'string' && TIME_REGEX.test(parsed.reminderTime))
        ? parsed.reminderTime
        : DEFAULT_SETTINGS.reminderTime,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * Validate settings object
 * @param settings - Settings object to validate
 * @returns true if valid, false otherwise
 */
export function validateSettings(settings: Settings): boolean {
  // Check notificationsEnabled is boolean
  if (typeof settings.notificationsEnabled !== 'boolean') {
    return false
  }
  
  // Check theme is valid
  if (!VALID_THEMES.includes(settings.theme)) {
    return false
  }
  
  // Check reminderTime is null or valid time format
  if (settings.reminderTime !== null) {
    if (typeof settings.reminderTime !== 'string') {
      return false
    }
    if (!TIME_REGEX.test(settings.reminderTime)) {
      return false
    }
  }
  
  return true
}

/**
 * Merge base settings with partial updates
 * @param base - Base settings object
 * @param updates - Partial updates to apply
 * @returns Merged settings object
 */
export function mergeSettings(base: Settings, updates: Partial<Settings>): Settings {
  return {
    notificationsEnabled: updates.notificationsEnabled !== undefined 
      ? updates.notificationsEnabled 
      : base.notificationsEnabled,
    theme: updates.theme !== undefined 
      ? updates.theme 
      : base.theme,
    reminderTime: updates.reminderTime !== undefined 
      ? updates.reminderTime 
      : base.reminderTime,
  }
}

/**
 * Parse time string to hours and minutes
 * @param time - Time string in HH:MM format
 * @returns Object with hours and minutes, or null if invalid
 */
export function parseTime(time: string | null): { hours: number; minutes: number } | null {
  if (!time) return null
  
  const match = time.match(TIME_REGEX)
  if (!match) return null
  
  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10),
  }
}

/**
 * Format hours and minutes to time string
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns Time string in HH:MM format
 */
export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
