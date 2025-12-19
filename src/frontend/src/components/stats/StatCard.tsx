/**
 * StatCard Component
 * Displays a statistic with icon and animated number
 * Requirements: 7.1, 7.4
 */

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  suffix?: string
  prefix?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  colorScheme?: 'primary' | 'success' | 'warning' | 'error'
  className?: string
}

/**
 * Animated number counter hook
 * Animates from 0 to target value with easing
 */
function useAnimatedNumber(target: number, duration: number = 800): number {
  const [current, setCurrent] = useState(0)
  const previousTarget = useRef(target)

  useEffect(() => {
    const startValue = previousTarget.current !== target ? current : 0
    previousTarget.current = target

    if (target === startValue) return

    const startTime = performance.now()
    const diff = target - startValue

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const newValue = startValue + diff * eased

      setCurrent(Math.round(newValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration])

  return current
}


const colorSchemes = {
  primary: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    icon: 'text-primary-600',
  },
  success: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    icon: 'text-success-600',
  },
  warning: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    icon: 'text-warning-600',
  },
  error: {
    bg: 'bg-error-100',
    text: 'text-error-700',
    icon: 'text-error-600',
  },
}

export function StatCard({
  title,
  value,
  icon,
  suffix = '',
  prefix = '',
  trend,
  colorScheme = 'primary',
  className,
}: StatCardProps) {
  const animatedValue = useAnimatedNumber(value)
  const colors = colorSchemes[colorScheme]

  return (
    <div
      className={cn(
        'bg-surface-container rounded-2xl p-6',
        'shadow-elevation-1 hover:shadow-elevation-2',
        'border border-outline-variant',
        'transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-lg', colors.bg, colors.icon)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-600 truncate">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            {prefix && (
              <span className="text-lg text-neutral-500">{prefix}</span>
            )}
            <span className="text-2xl font-semibold text-neutral-700">
              {animatedValue}
            </span>
            {suffix && (
              <span className="text-lg text-neutral-500">{suffix}</span>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success-600' : 'text-error-500'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-neutral-500">vs 上周</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Export the hook for reuse
export { useAnimatedNumber }
