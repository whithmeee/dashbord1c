import type {
  CustomerSales,
  MonthlySales,
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
  const period = mapPeriod(readRecord(payload.period, 'period'))
  const money = mapMoney(readRecord(payload.money, 'money'))

  return {
    integrationId: readSafeInteger(payload.integration_id, 'integration_id'),
    period,
    financialStatus: readFinancialStatus(payload.financial_status),
    financialStatusCode: readNullableString(payload.financial_status_code, 'financial_status_code'),
    money,
    monthly: readArray(payload.monthly, 'monthly').map(mapMonthly),
    totalAmountMinor: readNullableSafeInteger(payload.total_amount_minor, 'total_amount_minor'),
    customers: readArray(payload.customers, 'customers').map(mapCustomer),
    customersTotalAmountMinor: readNullableSafeInteger(
      payload.customers_total_amount_minor,
      'customers_total_amount_minor',
    ),
  }
}

function mapPeriod(value: Record<string, unknown>): SalesReportPeriod {
  return {
    from: readString(value.from, 'period.from'),
    to: readString(value.to, 'period.to'),
  }
}

function mapMoney(value: Record<string, unknown>): SalesReportMoney {
  return {
    currency: readNullableString(value.currency, 'money.currency'),
    currencyStatus: readString(value.currency_status, 'money.currency_status'),
    amountScale: readNullableSafeInteger(value.amount_scale, 'money.amount_scale'),
    unit: value.unit === null ? null : readString(value.unit, 'money.unit'),
  }
}

function mapMonthly(value: unknown): MonthlySales {
  const monthly = readRecord(value, 'monthly[]')
  return {
    period: readString(monthly.period, 'monthly[].period'),
    amountMinor: readSafeInteger(monthly.amount_minor, 'monthly[].amount_minor'),
  }
}

function mapCustomer(value: unknown): CustomerSales {
  const customer = readRecord(value, 'customers[]')
  return {
    name: readString(customer.name, 'customers[].name'),
    amountMinor: readSafeInteger(customer.amount_minor, 'customers[].amount_minor'),
  }
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${path} must be an object`)
  }
  return value as Record<string, unknown>
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw invalid(`${path} must be an array`)
  }
  return value
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalid(`${path} must be a string`)
  }
  return value
}

function readNullableString(value: unknown, path: string): string | null {
  return value === null ? null : readString(value, path)
}

function readSafeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw invalid(`${path} must be a safe integer`)
  }
  return value
}

function readNullableSafeInteger(value: unknown, path: string): number | null {
  return value === null ? null : readSafeInteger(value, path)
}

function readFinancialStatus(value: unknown): 'available' | 'unavailable' {
  if (value === 'available' || value === 'unavailable') return value
  throw invalid('financial_status must be available or unavailable')
}

function invalid(message: string): InvalidSalesReportError {
  return new InvalidSalesReportError(message)
}
