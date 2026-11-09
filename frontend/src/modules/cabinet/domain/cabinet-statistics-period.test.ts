import { describe, expect, it } from 'vitest'
import {
  formatDayCount,
  formatMonthLabel,
  formatPeriodLabel,
  isFutureMonth,
  shiftMonth,
  toMonthKey,
} from './cabinet-statistics-period'

describe('cabinet statistics period', () => {
  it('builds a month key from a date', () => {
    expect(toMonthKey(new Date(2026, 10, 9))).toBe('2026-11')
    expect(toMonthKey(new Date(2026, 0, 31))).toBe('2026-01')
  })

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-11', -1)).toBe('2026-10')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('rejects an invalid month', () => {
    expect(() => shiftMonth('2026-13', 1)).toThrow('Некорректный месяц')
  })

  it('recognises a month after the current one', () => {
    const now = new Date(2026, 10, 9)

    expect(isFutureMonth('2026-12', now)).toBe(true)
    expect(isFutureMonth('2026-11', now)).toBe(false)
    expect(isFutureMonth('2026-10', now)).toBe(false)
  })

  it('labels a month in Russian', () => {
    expect(formatMonthLabel('2026-10')).toBe('октябрь 2026 г.')
  })

  it('pluralises days in Russian', () => {
    expect(formatDayCount(1)).toBe('1 день')
    expect(formatDayCount(2)).toBe('2 дня')
    expect(formatDayCount(5)).toBe('5 дней')
    expect(formatDayCount(11)).toBe('11 дней')
    expect(formatDayCount(21)).toBe('21 день')
    expect(formatDayCount(0)).toBe('0 дней')
  })

  it('labels periods according to the grouping', () => {
    expect(formatPeriodLabel('2026-11-02 14:00', 'hour')).toBe('14:00')
    expect(formatPeriodLabel('2026-11', 'month')).toBe('ноябрь 2026 г.')
    expect(formatPeriodLabel('2026-11-02', 'day')).toBe('2 нояб.')
  })
})
