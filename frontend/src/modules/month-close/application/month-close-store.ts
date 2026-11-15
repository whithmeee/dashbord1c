import {
  createPeriodReportStore,
  type PeriodReportDetailsState,
  type PeriodReportGateway,
  type PeriodReportState,
  type PeriodReportStore,
} from '../../../shared/period-report/period-report-store'
import type { MonthCloseDetails, MonthCloseSummary } from '../domain/month-close'

export type MonthCloseGateway = PeriodReportGateway<MonthCloseSummary, MonthCloseDetails>
export type MonthCloseDetailsState = PeriodReportDetailsState<MonthCloseDetails>
export type MonthCloseState = PeriodReportState<MonthCloseSummary, MonthCloseDetails>
export type MonthCloseStore = PeriodReportStore<MonthCloseSummary, MonthCloseDetails>

export function createMonthCloseStore(gateway: MonthCloseGateway, session: { expireSession(): void }): MonthCloseStore {
  return createPeriodReportStore(gateway, session)
}
