export const reportGroups = [
  { id: 'all', label: 'Все отчёты' },
  { id: 'finance', label: 'Финансовый результат' },
  { id: 'cash', label: 'Денежные средства' },
  { id: 'settlements', label: 'Расчёты с контрагентами' },
  { id: 'inventory', label: 'Товары и материалы' },
  { id: 'assets', label: 'Основные средства' },
  { id: 'payroll', label: 'Зарплата' },
  { id: 'taxes', label: 'Налоги' },
  { id: 'accounting', label: 'Бухгалтерские отчёты' },
] as const

export type ReportGroup = (typeof reportGroups)[number]['id']
export type CatalogReport = {
  id: string
  title: string
  description: string
  group: Exclude<ReportGroup, 'all'>
  format: 'chart' | 'table'
  availability: 'demo' | 'planned'
  keywords: string
}

export function filterReports(
  reports: CatalogReport[],
  query: string,
  group: ReportGroup,
) {
  const terms = query
    .toLocaleLowerCase('ru')
    .replaceAll('ё', 'е')
    .trim()
    .split(/\s+/)
  return reports.filter((report) => {
    const text = `${report.title} ${report.description} ${report.keywords}`
      .toLocaleLowerCase('ru')
      .replaceAll('ё', 'е')
    return (
      (group === 'all' || report.group === group) &&
      terms.every((term) => text.includes(term))
    )
  })
}

export type PlannedReport = Omit<CatalogReport, 'availability' | 'keywords'> & {
  keywords?: string
}
