/**
 * Relative Time Formatting Utilities
 * Validates: Requirements 6.5
 */

/**
 * Format a timestamp to relative time string
 * @param timestamp - ISO timestamp string or Date object
 * @returns Relative time string (e.g., "2 小时前", "昨天", "3 天前")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  // Less than 1 minute
  if (diffSeconds < 60) {
    return '刚刚'
  }
  
  // Less than 1 hour
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  }
  
  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} 小时前`
  }
  
  // Yesterday
  if (diffDays === 1) {
    return '昨天'
  }
  
  // Less than 7 days
  if (diffDays < 7) {
    return `${diffDays} 天前`
  }
  
  // Less than 30 days
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} 周前`
  }
  
  // Less than 365 days
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} 个月前`
  }
  
  // More than a year
  const years = Math.floor(diffDays / 365)
  return `${years} 年前`
}

/**
 * Format a timestamp to full date string
 * @param timestamp - ISO timestamp string or Date object
 * @returns Full date string
 */
export function formatFullDate(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Get date string in YYYY-MM-DD format
 * @param date - Date object
 * @returns Date string
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
