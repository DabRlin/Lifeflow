/**
 * Notification Service
 * Provides cross-platform notification support
 * Uses Electron notifications when available, falls back to browser notifications
 */

import { isElectron } from '@/hooks/useElectron'

export interface NotificationOptions {
  title: string
  body: string
  taskId?: string
}

/**
 * Request notification permission (browser only)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isElectron()) {
    // Electron always has permission
    return true
  }

  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  if (isElectron()) {
    return true
  }
  return 'Notification' in window
}

/**
 * Show a notification
 */
export async function showNotification(
  options: NotificationOptions
): Promise<boolean> {
  if (isElectron() && window.electron) {
    return window.electron.showNotification(options)
  }

  // Browser fallback
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  new Notification(options.title, {
    body: options.body,
    icon: '/icon.png',
  })

  return true
}

/**
 * Show task reminder notification
 */
export async function showTaskReminder(
  taskTitle: string,
  taskId: string
): Promise<boolean> {
  return showNotification({
    title: '任务提醒',
    body: taskTitle,
    taskId,
  })
}

/**
 * Show habit reminder notification
 */
export async function showHabitReminder(habitName: string): Promise<boolean> {
  return showNotification({
    title: '习惯打卡提醒',
    body: `别忘了完成今天的「${habitName}」`,
  })
}

/**
 * Show streak achievement notification
 */
export async function showStreakAchievement(
  habitName: string,
  streakDays: number
): Promise<boolean> {
  return showNotification({
    title: '🎉 连续打卡成就',
    body: `恭喜！「${habitName}」已连续打卡 ${streakDays} 天！`,
  })
}
