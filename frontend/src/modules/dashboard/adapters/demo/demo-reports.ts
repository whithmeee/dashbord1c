import { createDemoFinance } from './demo-finance'
import type {
  DashboardReport,
  ReportPoint,
} from '../../domain/dashboard-report'

const revenue: ReportPoint[] = [
  { label: 'Май', amount: 2150000 },
  { label: 'Июн', amount: 2680000 },
  { label: 'Июл', amount: 2420000 },
  { label: 'Авг', amount: 3100000 },
  { label: 'Сен', amount: 2870000 },
  { label: 'Окт', amount: 3640000 },
]

const debtors: ReportPoint[] = [
  { label: 'Альфа Снаб', amount: 840000 },
  { label: 'Вектор', amount: 620000 },
  { label: 'Север Трейд', amount: 465000 },
  { label: 'Меридиан', amount: 310000 },
  { label: 'Горизонт', amount: 185000 },
]

export const demoReports: Record<'quarter' | 'half-year', DashboardReport> = {
  quarter: {
    ...createDemoFinance(revenue, 3),
    revenue: revenue.slice(3),
    debtors,
    revenueTotal: 9610000,
    topFiveDebt: 2420000,
    debtAsOf: '31 октября 2026',
  },
  'half-year': {
    ...createDemoFinance(revenue, 0),
    revenue,
    debtors,
    revenueTotal: 16860000,
    topFiveDebt: 2420000,
    debtAsOf: '31 октября 2026',
  },
}
