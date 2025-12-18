/**
 * Streak Calculation Utilities
 * Requirements: 5.1, 5.2, 5.5
 */

/**
 * Calculate streak from a list of check-in dates
 * Dates should be in YYYY-MM-DD format
 * 
 * @param checkinDates - Array of check-in dates in YYYY-MM-DD format
 * @param referenceDate - The date to calculate streak from (defaults to today)
 * @param timezoneOffset - Timezone offset in minutes (positive = west of UTC)
 * @returns Current streak count
 */
export function calculateStreak(
  checkinDates: string[],
  referenceDate?: string,
  timezoneOffset?: number
): number {
  if (checkinDates.length === 0) {
    return 0
  }

  // Get reference date (today in user's timezone)
  const today = referenceDate || getTodayInTimezone(timezoneOffset)
  
  // Sort dates in descending order (most recent first)
  const sortedDates = [...checkinDates].sort((a, b) => b.localeCompare(a))
  
  // Remove duplicates
  const uniqueDates = [...new Set(sortedDates)]
  
  // Check if the most recent check-in is today or yesterday
  const mostRecentDate = uniqueDates[0]
  const daysDiff = getDaysDifference(mostRecentDate, today)
  
  // If most recent check-in is more than 1 day ago, streak is broken
  if (daysDiff > 1) {
    return 0
  }
  
  // Count consecutive days
  let streak = 0
  let expectedDate = daysDiff === 0 ? today : getPreviousDay(today)
  
  for (const date of uniqueDates) {
    if (date === expectedDate) {
      streak++
      expectedDate = getPreviousDay(expectedDate)
    } else if (date < expectedDate) {
      // Gap found, streak ends
      break
    }
    // If date > expectedDate, skip (shouldn't happen with sorted array)
  }
  
  return streak
}

/**
 * Calculate the longest streak from a list of check-in dates
 * 
 * @param checkinDates - Array of check-in dates in YYYY-MM-DD format
 * @returns Longest streak count
 */
export function calculateLongestStreak(checkinDates: string[]): number {
  if (checkinDates.length === 0) {
    return 0
  }
  
  // Sort dates in ascending order
  const sortedDates = [...new Set(checkinDates)].sort((a, b) => a.localeCompare(b))
  
  let longestStreak = 1
  let currentStreak = 1
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1]
    const currDate = sortedDates[i]
    const daysDiff = getDaysDifference(prevDate, currDate)
    
    if (daysDiff === 1) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else if (daysDiff > 1) {
      currentStreak = 1
    }
    // daysDiff === 0 means duplicate date, skip
  }
  
  return longestStreak
}

/**
 * Check if a date is checked in
 * 
 * @param checkinDates - Array of check-in dates
 * @param targetDate - Date to check
 * @returns Whether the date is checked in
 */
export function isDateCheckedIn(checkinDates: string[], targetDate: string): boolean {
  return checkinDates.includes(targetDate)
}

/**
 * Get today's date in the user's timezone
 * 
 * @param timezoneOffset - Timezone offset in minutes (positive = west of UTC)
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayInTimezone(timezoneOffset?: number): string {
  const now = new Date()
  const offset = timezoneOffset ?? now.getTimezoneOffset()
  const localTime = new Date(now.getTime() - offset * 60 * 1000)
  return localTime.toISOString().split('T')[0]
}

/**
 * Get the previous day's date
 * 
 * @param date - Date in YYYY-MM-DD format
 * @returns Previous day in YYYY-MM-DD format
 */
export function getPreviousDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

/**
 * Get the next day's date
 * 
 * @param date - Date in YYYY-MM-DD format
 * @returns Next day in YYYY-MM-DD format
 */
export function getNextDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split('T')[0]
}

/**
 * Calculate the difference in days between two dates
 * 
 * @param date1 - First date in YYYY-MM-DD format
 * @param date2 - Second date in YYYY-MM-DD format
 * @returns Number of days between dates (positive if date2 > date1)
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z')
  const d2 = new Date(date2 + 'T00:00:00Z')
  const diffTime = d2.getTime() - d1.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Generate consecutive dates starting from a date
 * 
 * @param startDate - Start date in YYYY-MM-DD format
 * @param count - Number of consecutive days
 * @returns Array of consecutive dates
 */
export function generateConsecutiveDates(startDate: string, count: number): string[] {
  const dates: string[] = []
  let currentDate = startDate
  
  for (let i = 0; i < count; i++) {
    dates.push(currentDate)
    currentDate = getNextDay(currentDate)
  }
  
  return dates
}
