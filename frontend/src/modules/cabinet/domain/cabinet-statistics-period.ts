const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(month: string, delta: number): string {
  const match = MONTH_PATTERN.exec(month)

  if (!match) {
    throw new Error(`Некорректный месяц: ${month}`)
  }

  return toMonthKey(new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1))
}

export function isFutureMonth(month: string, now: Date): boolean {
  return month > toMonthKey(now)
}

export function formatMonthLabel(month: string): string {
  const match = MONTH_PATTERN.exec(month)

  if (!match) {
    return month
  }

  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, 1))
}

export function formatCalendarDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date)
}

export function formatCalendarDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function formatDayCount(count: number): string {
  const lastTwo = count % 100
  const last = count % 10

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} дней`
  }

  if (last === 1) {
    return `${count} день`
  }

  if (last >= 2 && last <= 4) {
    return `${count} дня`
  }

  return `${count} дней`
}

export function formatPeriodLabel(period: string, group: string): string {
  if (group === 'month') {
    return formatMonthLabel(period)
  }

  if (group === 'hour') {
    return period.slice(11)
  }

  const date = new Date(period)

  return Number.isNaN(date.getTime())
    ? period
    : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date)
}
