/**
 * DailyRing Component
 * Displays daily habit completion progress as an animated ring
 * Requirements: 5.3
 */

import { SafeECharts } from '@/components/common/SafeECharts'
import { cn } from '@/lib/utils'
import { chartColors, baseChartOptions } from '@/lib/charts'
import type { EChartsOption } from 'echarts'

export interface DailyRingProps {
  completed: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showPercentage?: boolean
  className?: string
}

export function DailyRing({
  completed,
  total,
  size = 'md',
  showLabel = true,
  showPercentage = true,
  className,
}: DailyRingProps) {
  // Calculate percentage, handle division by zero
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const sizeConfig = {
    sm: { width: 80, height: 80, lineWidth: 10, fontSize: 14 },
    md: { width: 120, height: 120, lineWidth: 12, fontSize: 20 },
    lg: { width: 180, height: 180, lineWidth: 16, fontSize: 28 },
  }

  const config = sizeConfig[size]

  // Determine color based on completion - using M3 palette (solid colors)
  const getProgressColor = () => {
    if (percentage >= 100) {
      // Completed: use primary light purple for success state
      return chartColors.primaryLight
    }
    // In progress: use muted primary purple (lighter than main primary)
    return chartColors.primaryMuted
  }

  const options: EChartsOption = {
    ...baseChartOptions,
    animationDuration: 800,
    animationEasing: 'elasticOut',
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            color: getProgressColor(),
          },
        },
        axisLine: {
          lineStyle: {
            width: config.lineWidth,
            color: [[1, chartColors.neutralLight]],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: percentage }],
        title: { show: false },
        detail: {
          show: showPercentage,
          fontSize: config.fontSize,
          fontWeight: 'bold',
          color: chartColors.primary,
          // Use a more rounded checkmark symbol for Apple-style design
          formatter: percentage >= 100 ? '✔' : `${percentage}%`,
          offsetCenter: [0, 0],
        },
      },
    ],
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <SafeECharts
        option={options}
        style={{ width: config.width, height: config.height }}
        opts={{ renderer: 'svg' }}
      />
      {showLabel && (
        <div className="text-center mt-2">
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-700">{completed}</span>
            <span className="mx-1">/</span>
            <span>{total}</span>
          </p>
          <p className="text-xs text-neutral-500">今日习惯</p>
        </div>
      )}
    </div>
  )
}
