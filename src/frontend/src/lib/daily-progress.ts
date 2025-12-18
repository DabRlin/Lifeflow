/**
 * Daily Progress Calculation Utilities
 * Requirements: 5.3
 */

import type { Task } from '@/api/types'

export interface DailyProgressData {
  total: number
  completed: number
  percentage: number
}

/**
 * Calculate daily progress from a list of habit tasks
 * 
 * @param habits - Array of habit tasks
 * @param targetDate - The date to calculate progress for (YYYY-MM-DD format)
 * @returns Daily progress data
 */
export function calculateDailyProgress(
  habits: Task[],
  targetDate?: string
): DailyProgressData {
  // Filter to only habit tasks
  const habitTasks = habits.filter(task => task.is_habit && !task.is_deleted)
  
  const total = habitTasks.length
  
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
    }
  }
  
  // Get target date (default to today)
  const date = targetDate || new Date().toISOString().split('T')[0]
  
  // Count completed habits for the target date
  const completed = habitTasks.filter(task => {
    return task.last_checkin_date === date
  }).length
  
  // Calculate percentage
  const percentage = Math.round((completed / total) * 100)
  
  return {
    total,
    completed,
    percentage,
  }
}

/**
 * Check if a habit is completed for a given date
 * 
 * @param habit - The habit task
 * @param targetDate - The date to check (YYYY-MM-DD format)
 * @returns Whether the habit is completed
 */
export function isHabitCompletedForDate(habit: Task, targetDate: string): boolean {
  return habit.is_habit && habit.last_checkin_date === targetDate
}

/**
 * Get habits that are not yet completed for a given date
 * 
 * @param habits - Array of habit tasks
 * @param targetDate - The date to check (YYYY-MM-DD format)
 * @returns Array of incomplete habits
 */
export function getIncompleteHabits(habits: Task[], targetDate: string): Task[] {
  return habits.filter(
    task => task.is_habit && !task.is_deleted && task.last_checkin_date !== targetDate
  )
}

/**
 * Get habits that are completed for a given date
 * 
 * @param habits - Array of habit tasks
 * @param targetDate - The date to check (YYYY-MM-DD format)
 * @returns Array of completed habits
 */
export function getCompletedHabits(habits: Task[], targetDate: string): Task[] {
  return habits.filter(
    task => task.is_habit && !task.is_deleted && task.last_checkin_date === targetDate
  )
}
