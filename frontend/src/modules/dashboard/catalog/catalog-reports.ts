import type { CatalogReport } from './report-catalog'
import { financialReports } from './financial-reports'
import { operatingReports } from './operating-reports'
import { accountingReports } from './accounting-reports'

export const catalogReports: CatalogReport[] = [
  {
    id: 'revenue',
    title: 'Динамика выручки',
    description: 'Выручка по месяцам за три или шесть месяцев.',
    group: 'finance',
    format: 'chart',
    availability: 'demo',
    keywords: 'продажи',
  },
  {
    id: 'top-debtors',
    title: 'Топ-5 должников',
    description: 'Пять крупнейших должников и суммы задолженности на дату.',
    group: 'settlements',
    format: 'chart',
    availability: 'demo',
    keywords: 'дебиторка контрагенты',
  },
  ...[...financialReports, ...operatingReports, ...accountingReports].map(
    (report) => ({
      ...report,
      availability: 'planned' as const,
      keywords: report.keywords ?? '',
    }),
  ),
]
