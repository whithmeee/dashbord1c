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

export function useReportChart(points: ReportPoint[]) {
  const reducedMotion = useReducedMotion()
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 650 },
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
