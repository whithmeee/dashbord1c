import type {
  CurrencyOption,
  MonthlyAmount,
  RankedAmount,
  SalesReport,
  SalesReportMoney,
  SalesReportPeriod,
} from './financial-sales'

export class InvalidSalesReportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSalesReportError'
  }
}

export function mapSalesReport(value: unknown): SalesReport {
  const payload = readRecord(value, 'sales report')
  return {
    integrationId: readSafeInteger(payload.integration_id, 'integration_id'),
    availablePeriod: payload.available_period === null
      ? null
      : { to: readString(readRecord(payload.available_period, 'available_period').to, 'available_period.to') },
    period: payload.period === null ? null : mapPeriod(readRecord(payload.period, 'period')),
    financialStatus: readFinancialStatus(payload.financial_status),
    financialStatusCode: readNullableString(payload.financial_status_code, 'financial_status_code'),
    money: mapMoney(readRecord(payload.money, 'money')),
    currencies: readArray(payload.currencies, 'currencies').map(mapCurrency),
    metrics: mapMetrics(readRecord(payload.metrics, 'metrics')),
    monthly: readArray(payload.monthly, 'monthly').map(mapMonthly),
    customers: readArray(payload.customers, 'customers').map(mapRanked),
    organizations: readArray(payload.organizations, 'organizations').map(mapRanked),
    receipts: readArray(payload.receipts, 'receipts').map(mapMonthly),
    payments: readArray(payload.payments, 'payments').map(mapMonthly),
    totalAmount: readDecimal(payload.total_amount, 'total_amount'),
  }
}

function mapPeriod(value: Record<string, unknown>): SalesReportPeriod {
  return { from: readString(value.from, 'period.from'), to: readString(value.to, 'period.to') }
}

function mapMoney(value: Record<string, unknown>): SalesReportMoney {
  return {
    currencyKey: readNullableString(value.currency_key, 'money.currency_key'),
    currency: readNullableString(value.currency, 'money.currency'),
    currencyStatus: readString(value.currency_status, 'money.currency_status'),
    amountScale: value.amount_scale === null ? null : readSafeInteger(value.amount_scale, 'money.amount_scale'),
    unit: readString(value.unit, 'money.unit'),
  }
}

function mapCurrency(value: unknown): CurrencyOption {
  const item = readRecord(value, 'currencies[]')
  return {
    key: readString(item.key, 'currencies[].key'),
    name: readString(item.name, 'currencies[].name'),
    documentCount: readSafeInteger(item.document_count, 'currencies[].document_count'),
  }
}

function mapMetrics(value: Record<string, unknown>): SalesReport['metrics'] {
  return {
    salesDocuments: readSafeInteger(value.sales_documents, 'metrics.sales_documents'),
    customers: readSafeInteger(value.customers, 'metrics.customers'),
    organizations: readSafeInteger(value.organizations, 'metrics.organizations'),
  }
}

function mapMonthly(value: unknown): MonthlyAmount {
  const item = readRecord(value, 'monthly amount')
  return {
    period: readString(item.period, 'monthly amount.period'),
    amount: readDecimal(item.amount, 'monthly amount.amount'),
    documentCount: readSafeInteger(item.document_count, 'monthly amount.document_count'),
  }
}

function mapRanked(value: unknown): RankedAmount {
  const item = readRecord(value, 'ranked amount')
  return {
    key: readString(item.key, 'ranked amount.key'),
    name: readString(item.name, 'ranked amount.name'),
    amount: readDecimal(item.amount, 'ranked amount.amount'),
    documentCount: readSafeInteger(item.document_count, 'ranked amount.document_count'),
  }
}

function readDecimal(value: unknown, path: string): number {
  if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw invalid(`${path} must be a decimal string`)
  }
  const number = Number(value)
  if (!Number.isFinite(number)) throw invalid(`${path} is outside the supported range`)
  return number
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${path} must be an object`)
  return value as Record<string, unknown>
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw invalid(`${path} must be an array`)
  return value
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw invalid(`${path} must be a string`)
  return value
}

function readNullableString(value: unknown, path: string): string | null {
  return value === null ? null : readString(value, path)
}

function readSafeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw invalid(`${path} must be a safe integer`)
  return value
}

function readFinancialStatus(value: unknown): 'available' | 'empty' {
  if (value === 'available' || value === 'empty') return value
  throw invalid('financial_status must be available or empty')
}

function invalid(message: string): InvalidSalesReportError {
  return new InvalidSalesReportError(message)
}
