/**
 * HeatmapCalendar Component
 * Displays check-in patterns as a calendar heatmap
 * Requirements: 5.4
 */

import { SafeECharts } from '@/components/common/SafeECharts'
import { cn } from '@/lib/utils'
import { chartColors, baseChartOptions } from '@/lib/charts'
import type { EChartsOption } from 'echarts'

export interface HeatmapCalendarProps {
  /** Array of [date, count] tuples where date is YYYY-MM-DD format */
  data: Array<[string, number]>
  /** Year to display (defaults to current year) */
  year?: number
  /** Maximum value for color scale (defaults to auto-detect) */
  maxValue?: number
  /** Height of the calendar */
  height?: number
  className?: string
}

export function HeatmapCalendar({
  data,
  year = new Date().getFullYear(),
  maxValue,
  height = 180,
  className,
}: HeatmapCalendarProps) {
  // Calculate max value if not provided
  const calculatedMax = maxValue ?? Math.max(...data.map(d => d[1]), 1)

  const options: EChartsOption = {
    ...baseChartOptions,
    tooltip: {
      position: 'top',
      formatter: (params: unknown) => {
        const p = params as { value: [string, number] }
        if (!p.value || p.value[1] === undefined) return ''
        const count = p.value[1]
        return `${p.value[0]}<br/>${count} 次打卡`
      },
    },
    visualMap: {
      min: 0,
      max: calculatedMax,
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      text: ['多', '少'],
      textStyle: {
        color: chartColors.neutral,
        fontSize: 10,
      },
      inRange: {
        color: [
          '#F3EDF7', // surface-container
          '#E8DEF8', // secondary-50
          '#D0BCFF', // primary-200
          '#6750A4', // primary-500
        ],
      },
    },
    calendar: {
      top: 50,
      left: 40,
      right: 40,
      bottom: 40,
      cellSize: ['auto', 13],
      range: year.toString(),
      itemStyle: {
        borderWidth: 3,
        borderColor: '#FFFBFE',
        borderRadius: 6,
      },
      yearLabel: {
        show: true,
        position: 'top',
        margin: 26,
        color: chartColors.neutral,
        fontSize: 14,
        fontWeight: 'bold',
      },
      dayLabel: {
        firstDay: 1,
        nameMap: ['日', '一', '二', '三', '四', '五', '六'],
        color: chartColors.neutral,
        fontSize: 10,
      },
      monthLabel: {
        nameMap: 'cn',
        color: chartColors.neutral,
        fontSize: 10,
      },
      splitLine: {
        show: false,
      },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data,
        itemStyle: {
          borderRadius: 4,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 4,
          },
        },
      },
    ],
  }

  return (
    <div className={cn('w-full', className)}>
      <SafeECharts
        option={options}
        style={{ width: '100%', height }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}
