/**
 * HabitCard Component
 * Displays a habit with streak info and check-in functionality
 * Requirements: 5.1, 5.2
 */

import * as React from 'react'
import { cn, getLocalDateString } from '@/lib/utils'
import type { Task } from '@/api/types'
import { StreakBadge } from './StreakBadge'
import { CheckinButton } from './CheckinButton'
import { Clock, Edit2, MoreVertical, Trash2 } from 'lucide-react'

export interface HabitCardProps {
  habit: Task
  isCheckingIn?: boolean
  onCheckin: (habit: Task) => void
  onEdit?: (habit: Task) => void
  onDelete?: (habit: Task) => void
  className?: string
}

export function HabitCard({
  habit,
  isCheckingIn = false,
  onCheckin,
  onEdit,
  onDelete,
  className,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Check if habit was completed today
  const isCompletedToday = React.useMemo(() => {
    if (!habit.last_checkin_date) return false
    const today = getLocalDateString()
    return habit.last_checkin_date === today
  }, [habit.last_checkin_date])

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCheckin = React.useCallback(() => {
    if (!isCompletedToday && !isCheckingIn) {
      onCheckin(habit)
    }
  }, [habit, isCompletedToday, isCheckingIn, onCheckin])

  return (
    <div
      className={cn(
        'group relative bg-surface-container rounded-2xl border border-outline-variant',
        'shadow-elevation-1 hover:shadow-elevation-2',
        'transition-all duration-200 ease-out',
        'p-4',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Check-in Button */}
        <CheckinButton
          isCheckedIn={isCompletedToday}
          isLoading={isCheckingIn}
          onCheckin={handleCheckin}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'text-sm text-neutral-700 font-medium leading-snug',
                isCompletedToday && 'text-primary-600'
              )}
            >
              {habit.title}
            </h3>

            {/* More Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'p-1.5 rounded-md',
                  'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                  'opacity-0 group-hover:opacity-100 focus:opacity-100',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="更多操作"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className={cn(
                    'absolute right-0 top-full mt-1 z-10',
                    'bg-white rounded-lg shadow-elevation-3 border border-outline-variant',
                    'py-1 min-w-[120px]',
                    'animate-fade-in'
                  )}
                >
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onEdit(habit)
                      }}
                      className="flex items-center gap-2 w-[calc(100%-8px)] mx-1 px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onDelete(habit)
                      }}
                      className="flex items-center gap-2 w-[calc(100%-8px)] mx-1 px-2 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {habit.content && (
            <p className="text-neutral-500 text-xs mt-1 line-clamp-2">
              {habit.content}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-3">
            {/* Streak Badge */}
            <StreakBadge
              streak={habit.current_streak}
              longestStreak={habit.longest_streak}
              size="sm"
            />

            {/* Reminder Time */}
            {habit.reminder_time && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                <Clock className="w-3 h-3" />
                {habit.reminder_time}
              </span>
            )}

            {/* Completed Today Indicator */}
            {isCompletedToday && (
              <span className="text-xs text-primary-500 font-medium">
                今日已完成
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
