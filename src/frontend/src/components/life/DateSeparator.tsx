/**
 * DateSeparator Component
 * Displays a date separator in the timeline
 * Validates: Requirements 6.1, 6.6
 */

import { cn } from '@/lib/utils'

interface DateSeparatorProps {
  date: string
  className?: string
}

/**
 * Format date string to display format
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string
 */
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const entryDate = new Date(date)
  entryDate.setHours(0, 0, 0, 0)
  
  if (entryDate.getTime() === today.getTime()) {
    return '今天'
  }
  
  if (entryDate.getTime() === yesterday.getTime()) {
    return '昨天'
  }
  
  // Check if same year
  const isSameYear = date.getFullYear() === today.getFullYear()
  
  if (isSameYear) {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function DateSeparator({ date, className }: DateSeparatorProps) {
  const displayDate = formatDateDisplay(date)
  
  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      <div className="h-px flex-1 bg-neutral-200" />
      <span className="text-sm font-medium text-neutral-500 px-2">
        {displayDate}
      </span>
      <div className="h-px flex-1 bg-neutral-200" />
    </div>
  )
}
