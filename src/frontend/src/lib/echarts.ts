/**
 * ECharts Configuration
 * Import only the components we need to reduce bundle size
 */

import * as echarts from 'echarts/core'
import { GaugeChart, LineChart, HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

// Register required components
echarts.use([
  // Charts
  GaugeChart,
  LineChart,
  HeatmapChart,
  // Components
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent,
  LegendComponent,
  // Renderers
  CanvasRenderer,
  SVGRenderer,
])

export { echarts }
export default echarts
