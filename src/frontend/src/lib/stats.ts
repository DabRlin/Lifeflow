/**
 * Statistics Calculation Utilities
 * Requirements: 7.1-7.5
 */

import type { Task, CheckinRecord } from '@/api/types'

export interface StatsResult {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  longestStreak: number
  todayCheckins: number
}

/**
 * Calculate statistics from tasks and check-in records
 * 
 * @param tasks - Array of task objects
 * @param checkinRecords - Array of check-in records
 * @param todayDate - Today's date in YYYY-MM-DD format
 * @returns Statistics result object
 */
export function calculateStats(
  tasks: Task[],
  checkinRecords: CheckinRecord[],
  todayDate: string
): StatsResult {
  // Filter out deleted tasks
  const activeTasks = tasks.filter((t) => !t.is_deleted)
  
  const totalTasks = activeTasks.length
  
  // Completed tasks are non-habit tasks that are marked as deleted (soft delete = completed)
  // For habits, we count based on today's check-ins
  const habitTasks = activeTasks.filter((t) => t.is_habit)
  
  // Count today's check-ins for habits
  const todayCheckins = checkinRecords.filter(
    (r) => r.checkin_date === todayDate
  ).length
  
  // For completion rate, we consider:
  // - Non-habit tasks: count as completed if they have been checked off (is_deleted = true in original)
  // - Habit tasks: count as completed if checked in today
  const completedHabits = habitTasks.filter((t) => {
    return checkinRecords.some(
      (r) => r.task_id === t.id && r.checkin_date === todayDate
    )
  }).length
  
  // For non-habit tasks, we count those that are not pending
  // Since we filtered out deleted tasks, all remaining non-habit tasks are pending
  const completedNonHabits = 0 // Non-habit tasks in activeTasks are all pending
  
  const completedTasks = completedHabits + completedNonHabits
  const pendingTasks = totalTasks - completedTasks

  
  // Calculate completion rate (percentage)
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0
  
  // Find longest streak from all habit tasks
  const longestStreak = habitTasks.reduce((max, task) => {
    return Math.max(max, task.longest_streak || 0)
  }, 0)
  
  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
    longestStreak,
    todayCheckins,
  }
}

/**
 * Calculate completion rate from completed and total counts
 * Handles division by zero
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total <= 0) return 0
  if (completed < 0) return 0
  if (completed > total) return 100
  return Math.round((completed / total) * 100)
}

/**
 * Count check-ins for a specific date
 */
export function countCheckinsByDate(
  checkinRecords: CheckinRecord[],
  date: string
): number {
  return checkinRecords.filter((r) => r.checkin_date === date).length
}

/**
 * Get unique check-in dates from records
 */
export function getUniqueCheckinDates(checkinRecords: CheckinRecord[]): string[] {
  const dates = new Set(checkinRecords.map((r) => r.checkin_date))
  return Array.from(dates).sort()
}

/**
 * Calculate trend data for the last N days
 */
export function calculateTrendData(
  checkinRecords: CheckinRecord[],
  days: number,
  endDate: string
): Array<{ date: string; value: number }> {
  const result: Array<{ date: string; value: number }> = []
  
  // Generate dates from endDate going back 'days' days
  let currentDate = endDate
  const dates: string[] = []
  
  for (let i = 0; i < days; i++) {
    dates.unshift(currentDate)
    currentDate = getPreviousDay(currentDate)
  }
  
  // Count check-ins for each date
  for (const date of dates) {
    const count = countCheckinsByDate(checkinRecords, date)
    result.push({ date, value: count })
  }
  
  return result
}

/**
 * Get previous day in YYYY-MM-DD format
 */
function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().split('T')[0]
}

/**
 * Find the longest streak from an array of tasks
 */
export function findLongestStreak(tasks: Task[]): number {
  return tasks.reduce((max, task) => {
    return Math.max(max, task.longest_streak || 0)
  }, 0)
}

/**
 * Count active (non-deleted) tasks
 */
export function countActiveTasks(tasks: Task[]): number {
  return tasks.filter((t) => !t.is_deleted).length
}

/**
 * Count habit tasks
 */
export function countHabitTasks(tasks: Task[]): number {
  return tasks.filter((t) => !t.is_deleted && t.is_habit).length
}
