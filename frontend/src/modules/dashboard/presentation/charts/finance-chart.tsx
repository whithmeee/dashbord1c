import { Bar, Line } from 'react-chartjs-2'
import type { ReportPoint } from '../../domain/dashboard-report'
import { useReportChart } from './chart-presentation'
import { formatAxisMoney } from '../reports/money-format'

export function FinanceChart({
  points,
  label,
  color,
  variant,
}: {
  points: ReportPoint[]
  label: string
  color: string
  variant: 'line' | 'bar'
}) {
  const chart = useReportChart(points)
  const data = {
    labels: chart.labels,
    datasets: [
      {
        label,
        data: chart.values,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        borderRadius: 6,
        tension: 0.3,
        pointRadius: 4,
        maxBarThickness: 48,
      },
    ],
  }
  const options = {
    ...chart.options,
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => formatAxisMoney(Number(value)),
        },
      },
    },
  }

  return (
    <div className="dashboard-chart">
      {variant === 'line' ? (
        <Line role="img" aria-label={label} options={options} data={data} />
      ) : (
        <Bar role="img" aria-label={label} options={options} data={data} />
      )}
    </div>
  )
}
