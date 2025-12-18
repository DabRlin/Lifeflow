/**
 * TrendChart Component
 * Displays completion trends using ECharts line chart
 * Requirements: 7.3
 */

import { SafeECharts } from '@/components/common/SafeECharts'
import { cn } from '@/lib/utils'
import { chartColors, baseChartOptions } from '@/lib/charts'
import type { EChartsOption } from 'echarts'

export interface TrendDataPoint {
  date: string
  value: number
}

export interface TrendChartProps {
  data: TrendDataPoint[]
  title?: string
  label?: string
  height?: number
  showArea?: boolean
  colorScheme?: 'primary' | 'success' | 'warning'
  className?: string
}

const colorSchemeMap = {
  primary: {
    line: chartColors.primary,
    areaStart: 'rgba(103, 80, 164, 0.3)',
    areaEnd: 'rgba(103, 80, 164, 0.05)',
  },
  success: {
    line: chartColors.primary, // Use primary purple for success (M3 style)
    areaStart: 'rgba(103, 80, 164, 0.3)',
    areaEnd: 'rgba(103, 80, 164, 0.05)',
  },
  warning: {
    line: chartColors.warning,
    areaStart: 'rgba(255, 193, 7, 0.3)',
    areaEnd: 'rgba(255, 193, 7, 0.05)',
  },
}

export function TrendChart({
  data,
  title,
  label = '完成数',
  height = 280,
  showArea = true,
  colorScheme = 'primary',
  className,
}: TrendChartProps) {
  const colors = colorSchemeMap[colorScheme]
  const dates = data.map((d) => d.date)
  const values = data.map((d) => d.value)


  const options: EChartsOption = {
    ...baseChartOptions,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'white',
      borderColor: chartColors.neutralLight,
      borderWidth: 1,
      textStyle: { color: chartColors.neutral, fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as Array<{ name: string; value: number }>
        if (p && p[0]) {
          return `<div class="font-medium">${p[0].name}</div>
                  <div class="text-neutral-500">${label}: ${p[0].value}</div>`
        }
        return ''
      },
    },
    grid: {
      left: 40,
      right: 20,
      top: title ? 50 : 20,
      bottom: 30,
    },
    title: title
      ? {
          text: title,
          left: 0,
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#171717',
          },
        }
      : undefined,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: chartColors.neutralLight } },
      axisLabel: {
        color: chartColors.neutral,
        fontSize: 11,
        formatter: (value: string) => {
          // Show only month-day for cleaner display
          const parts = value.split('-')
          return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : value
        },
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: {
        lineStyle: { color: chartColors.neutralLight, type: 'dashed' },
      },
      axisLabel: { color: chartColors.neutral, fontSize: 11 },
      minInterval: 1,
    },
    series: [
      {
        name: label,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: data.length <= 14,
        lineStyle: { color: colors.line, width: 2 },
        itemStyle: { color: colors.line },
        areaStyle: showArea
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: colors.areaStart },
                  { offset: 1, color: colors.areaEnd },
                ],
              },
            }
          : undefined,
        data: values,
      },
    ],
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-4',
        'shadow-elevation-1',
        'border border-neutral-100',
        className
      )}
    >
      <SafeECharts
        option={options}
        style={{ height }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}
