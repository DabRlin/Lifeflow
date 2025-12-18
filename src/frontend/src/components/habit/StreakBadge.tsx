/**
 * StreakBadge Component
 * Displays streak count with visual emphasis for 7+ day streaks
 * Requirements: 5.1, 5.2
 */

import { cn } from '@/lib/utils'
import { Flame, Trophy } from 'lucide-react'

export interface StreakBadgeProps {
  streak: number
  longestStreak?: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function StreakBadge({
  streak,
  longestStreak,
  size = 'md',
  showIcon = true,
  className,
}: StreakBadgeProps) {
  // Determine badge style based on streak length
  const isRecordStreak = longestStreak !== undefined && streak >= longestStreak && streak > 0

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  // Choose icon based on streak length only (longer = Trophy)
  // Trophy for 30+ days, Flame for all others
  const Icon = streak >= 30 ? Trophy : Flame

  if (streak === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          'bg-neutral-100 text-neutral-500',
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Flame className={cn(iconSizes[size], 'opacity-50')} />}
        <span>0 天</span>
      </span>
    )
  }

  // Color intensity based on streak length (longer = deeper color)
  const getStreakColorClass = () => {
    if (streak >= 30) {
      // 30+ days (Trophy): deepest color
      return 'bg-primary-200 text-primary-700'
    }
    if (streak >= 7) {
      // 7-29 days: medium-deep color
      return 'bg-primary-100 text-primary-600'
    }
    // 1-6 days: visible but lighter
    return 'bg-neutral-300 text-neutral-700'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'transition-all duration-300',
        getStreakColorClass(),
        sizeClasses[size],
        className
      )}
      title={
        isRecordStreak
          ? `最长连胜记录！`
          : longestStreak
            ? `最长连胜: ${longestStreak} 天`
            : undefined
      }
    >
      {showIcon && (
        <Icon
          className={cn(iconSizes[size])}
          aria-hidden="true"
        />
      )}
      <span>{streak} 天</span>
    </span>
  )
}
