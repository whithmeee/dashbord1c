import { Bar, Line } from 'react-chartjs-2'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatAxisMoney } from '../reports/money-format'
import { useReportChart } from './chart-presentation'
import './report-charts.css'

type ReportChartProps = { points: ReportPoint[] }

const amountAxis = {
  beginAtZero: true,
  ticks: {
    callback: (value: string | number) => formatAxisMoney(Number(value)),
  },
}

export function RevenueChart({ points }: ReportChartProps) {
  const chart = useReportChart(points)
  return (
    <div className="dashboard-chart" data-testid="revenue-chart">
      <Line
        role="img"
        aria-label="Выручка по месяцам в рублях"
        options={{
          ...chart.options,
          scales: {
            x: { grid: { display: false } },
            y: amountAxis,
          },
        }}
        data={{
          labels: chart.labels,
          datasets: [
            {
              label: 'Выручка',
              data: chart.values,
              borderColor: '#0071e3',
              backgroundColor: 'rgba(0, 113, 227, 0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#0071e3',
              borderWidth: 2.5,
            },
          ],
        }}
      />
    </div>
  )
}

export function DebtorsChart({ points }: ReportChartProps) {
  const chart = useReportChart(points)
  return (
    <div className="dashboard-chart" data-testid="debtors-chart">
      <Bar
        role="img"
        aria-label="Пять крупнейших должников, долг в рублях"
        options={{
          ...chart.options,
          indexAxis: 'y',
          scales: {
            x: amountAxis,
            y: { grid: { display: false } },
          },
        }}
        data={{
          labels: chart.labels,
          datasets: [
            {
              label: 'Задолженность',
              data: chart.values,
              backgroundColor: [
                '#0071e3',
                '#338dea',
                '#66a9ef',
                '#8cbbf3',
                '#b3d4f8',
              ],
              borderRadius: 6,
              barThickness: 24,
            },
          ],
        }}
      />
    </div>
  )
}
