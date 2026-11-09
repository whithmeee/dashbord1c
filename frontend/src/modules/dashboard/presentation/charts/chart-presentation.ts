import type { ReportPoint } from '../../domain/dashboard-report'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  DoughnutController,
  Filler,
  Legend,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js'
import { useReducedMotion } from 'motion/react'
import { formatMoney } from '../reports/money-format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  DoughnutController,
  Filler,
  Legend,
  Tooltip,
)

ChartJS.defaults.font.family =
  '-apple-system, BlinkMacSystemFont, "Inter Variable", "Segoe UI", sans-serif'
ChartJS.defaults.color = '#62626a'

export const activePointCrosshairPlugin: Plugin<'line'> = {
  id: 'active-point-crosshair',
  afterDraw(chart) {
    const activeElement = chart.tooltip?.getActiveElements()[0]?.element
    if (!activeElement) return

    const { ctx, chartArea } = chart
    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(0, 113, 227, 0.35)'
    ctx.lineWidth = 1
    ctx.moveTo(activeElement.x, chartArea.top)
    ctx.lineTo(activeElement.x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

export function useReportChart(points: ReportPoint[]) {
  const reducedMotion = useReducedMotion()
  const options = createReportChartOptions(Boolean(reducedMotion))
  return {
    options,
    labels: points.map((point) => point.label),
    values: points.map((point) => point.amount),
  }
}

export function createReportChartOptions(reducedMotion: boolean) {
  const updateDuration = reducedMotion ? 0 : 380
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false, axis: 'x' },
    hover: { mode: 'index', intersect: false },
    animation: reducedMotion ? false : { duration: 520, easing: 'easeOutCubic' },
    transitions: {
      default: { animation: { duration: updateDuration, easing: 'easeOutCubic' } },
      resize: { animation: { duration: 0 } },
      active: { animation: { duration: 0 } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (item) => formatMoney(Number(item.raw)),
        },
      },
    },
  } satisfies ChartOptions<'line' | 'bar'>
  return options
}
