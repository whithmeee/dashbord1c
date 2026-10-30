import type { ReportPoint } from '../../domain/dashboard-report'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { useReducedMotion } from 'motion/react'
import { formatMoney } from '../reports/money-format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
)

ChartJS.defaults.font.family =
  '-apple-system, BlinkMacSystemFont, "Inter Variable", "Segoe UI", sans-serif'
ChartJS.defaults.color = '#62626a'

export function useReportChart(points: ReportPoint[]) {
  const reducedMotion = useReducedMotion()
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 180 },
    transitions: {
      resize: { animation: { duration: 0 } },
      active: { animation: { duration: 0 } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => formatMoney(Number(item.raw)),
        },
      },
    },
  } satisfies ChartOptions<'line' | 'bar'>
  return {
    options,
    labels: points.map((point) => point.label),
    values: points.map((point) => point.amount),
  }
}
