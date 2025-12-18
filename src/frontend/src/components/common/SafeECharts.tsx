/**
 * SafeECharts Component
 * Direct ECharts wrapper that avoids echarts-for-react unmount issues
 */

import * as React from 'react'
import { echarts } from '@/lib/echarts'
import type { EChartsOption } from 'echarts'

export interface SafeEChartsProps {
  option: EChartsOption
  style?: React.CSSProperties
  className?: string
  opts?: {
    renderer?: 'canvas' | 'svg'
    devicePixelRatio?: number
    width?: number | string
    height?: number | string
  }
  notMerge?: boolean
  lazyUpdate?: boolean
}

export function SafeECharts({
  option,
  style,
  className,
  opts = { renderer: 'svg' },
  notMerge = false,
  lazyUpdate = false,
}: SafeEChartsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<echarts.ECharts | null>(null)

  // Initialize chart
  React.useEffect(() => {
    if (!containerRef.current) return

    // Create chart instance
    chartRef.current = echarts.init(containerRef.current, undefined, opts)

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.dispose()
        } catch {
          // Ignore disposal errors
        }
        chartRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update options when they change
  React.useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, notMerge, lazyUpdate)
    }
  }, [option, notMerge, lazyUpdate])

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={containerRef} style={style} className={className} />
}
