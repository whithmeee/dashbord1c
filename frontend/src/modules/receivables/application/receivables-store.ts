import {
  createPeriodReportStore,
  type PeriodReportDetailsState,
  type PeriodReportState,
  type PeriodReportStore,
} from '../../../shared/period-report/period-report-store'
import type { ReceivablesGateway } from '../adapters/http-receivables-gateway'
import type { ReceivablesDetails, ReceivablesSummary } from '../domain/receivables'

export type ReceivablesDetailsState = PeriodReportDetailsState<ReceivablesDetails>
export type ReceivablesState = PeriodReportState<ReceivablesSummary, ReceivablesDetails>
export type ReceivablesStore = PeriodReportStore<ReceivablesSummary, ReceivablesDetails>

export function createReceivablesStore(gateway: ReceivablesGateway, session: { expireSession(): void }): ReceivablesStore {
  return createPeriodReportStore(gateway, session)
}
