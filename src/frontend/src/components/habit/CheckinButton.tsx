/**
 * CheckinButton Component
 * Animated check-in button with celebratory feedback
 * Requirements: 5.1, 5.2
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'

export interface CheckinButtonProps {
  isCheckedIn: boolean
  isLoading?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  onCheckin: () => void
  className?: string
}

export function CheckinButton({
  isCheckedIn,
  isLoading = false,
  disabled = false,
  size = 'md',
  onCheckin,
  className,
}: CheckinButtonProps) {
  const [showCelebration, setShowCelebration] = React.useState(false)
  const [wasJustCheckedIn, setWasJustCheckedIn] = React.useState(false)

  const handleClick = React.useCallback(() => {
    if (isCheckedIn || isLoading || disabled) return
    onCheckin()
    setWasJustCheckedIn(true)
    setShowCelebration(true)
    
    // Hide celebration after animation
    setTimeout(() => {
      setShowCelebration(false)
    }, 1000)
  }, [isCheckedIn, isLoading, disabled, onCheckin])

  // Reset wasJustCheckedIn when isCheckedIn changes from external source
  React.useEffect(() => {
    if (!isCheckedIn) {
      setWasJustCheckedIn(false)
    }
  }, [isCheckedIn])

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleClick}
        disabled={isCheckedIn || isLoading || disabled}
        className={cn(
          'relative rounded-full border-4 flex items-center justify-center',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2',
          sizeClasses[size],
          isCheckedIn
            ? 'bg-primary-100 border-primary-300 text-primary-600 cursor-default'
            : 'border-neutral-400 hover:bg-primary-50 hover:border-primary-400 hover:scale-105',
          isLoading && 'cursor-wait',
          disabled && !isCheckedIn && 'opacity-50 cursor-not-allowed',
          wasJustCheckedIn && 'animate-checkin-success'
        )}
        aria-label={isCheckedIn ? '已打卡' : '打卡'}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : isCheckedIn ? (
          <Check className={cn(iconSizes[size], wasJustCheckedIn && 'animate-scale-in')} />
        ) : null}
      </button>

      {/* Celebration ripple effect */}
      {showCelebration && (
        <>
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-primary-200 animate-ping-once',
              'pointer-events-none'
            )}
          />
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-primary-100 animate-ping-once-delayed',
              'pointer-events-none'
            )}
          />
        </>
      )}
    </div>
  )
}
