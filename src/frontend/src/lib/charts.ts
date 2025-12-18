import type { EChartsOption } from 'echarts'

// Design tokens for charts - Material Design 3 palette
export const chartColors = {
  primary: '#6750A4',      // M3 Primary
  primaryLight: '#D0BCFF', // M3 Primary Container
  primaryMuted: '#9A82DB', // M3 Primary lighter (for rings)
  tertiary: '#7D5260',     // M3 Tertiary (pink)
  tertiaryLight: '#FFD8E4', // M3 Tertiary Container
  warning: '#FFC107',      // M3 Warning
  error: '#DE3730',        // M3 Error
  neutral: '#79747E',      // M3 Outline
  neutralLight: '#E6E0E9', // M3 Surface Container
  background: '#FFFBFE',   // M3 Surface
}

// Common chart options
export const baseChartOptions: Partial<EChartsOption> = {
  animation: true,
  animationDuration: 500,
  animationEasing: 'cubicOut',
}

// Daily ring (gauge) chart configuration
export function createDailyRingOptions(percentage: number): EChartsOption {
  return {
    ...baseChartOptions,
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
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: chartColors.primary },
                { offset: 1, color: chartColors.primaryLight },
              ],
            },
          },
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, chartColors.neutralLight]],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: percentage }],
        title: { show: false },
        detail: {
          fontSize: 24,
          fontWeight: 'bold',
          color: chartColors.primary,
          formatter: '{value}%',
          offsetCenter: [0, 0],
        },
      },
    ],
  }
}

// Line chart for trends
export function createTrendChartOptions(
  dates: string[],
  values: number[],
  label: string
): EChartsOption {
  return {
    ...baseChartOptions,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'white',
      borderColor: chartColors.neutralLight,
      textStyle: { color: chartColors.neutral },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: chartColors.neutralLight } },
      axisLabel: { color: chartColors.neutral },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: chartColors.neutralLight, type: 'dashed' } },
      axisLabel: { color: chartColors.neutral },
    },
    series: [
      {
        name: label,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: chartColors.primary, width: 2 },
        itemStyle: { color: chartColors.primary },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 80, 164, 0.3)' },
              { offset: 1, color: 'rgba(103, 80, 164, 0.05)' },
            ],
          },
        },
        data: values,
      },
    ],
  }
}

// Calendar heatmap configuration
export function createHeatmapOptions(
  data: Array<[string, number]>,
  year: number
): EChartsOption {
  return {
    ...baseChartOptions,
    tooltip: {
      formatter: (params: unknown) => {
        const p = params as { value: [string, number] }
        return `${p.value[0]}: ${p.value[1]} 次打卡`
      },
    },
    visualMap: {
      min: 0,
      max: 5,
      show: false,
      inRange: {
        color: [chartColors.neutralLight, chartColors.primaryLight, chartColors.primary],
      },
    },
    calendar: {
      top: 30,
      left: 30,
      right: 30,
      cellSize: ['auto', 15],
      range: year.toString(),
      itemStyle: {
        borderWidth: 2,
        borderColor: 'white',
      },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 1,
        nameMap: ['日', '一', '二', '三', '四', '五', '六'],
        color: chartColors.neutral,
      },
      monthLabel: {
        nameMap: 'cn',
        color: chartColors.neutral,
      },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data,
      },
    ],
  }
}
