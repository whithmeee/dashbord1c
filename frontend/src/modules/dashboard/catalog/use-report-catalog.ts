import { useState } from 'react'
import { filterReports, type ReportGroup } from './report-catalog'
import { catalogReports } from './catalog-reports'

export function useReportCatalog() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<ReportGroup>('all')
  const reset = () => {
    setQuery('')
    setGroup('all')
  }

  return {
    query,
    group,
    setQuery,
    setGroup,
    reset,
    reports: filterReports(catalogReports, query, group),
    total: catalogReports.length,
  }
}
