import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Calendar } from './calendar'
import { DatePicker, MonthPicker } from './calendar-field'
import { dateToValue, monthToValue, valueToDate } from './calendar-value'

describe('calendar fields', () => {
  it('keeps API date values stable in the local timezone', () => {
    expect(dateToValue(new Date(2026, 10, 7))).toBe('2026-11-07')
    expect(monthToValue(new Date(2026, 9, 18))).toBe('2026-10')
    expect(valueToDate('2026-11-07')).toEqual(new Date(2026, 10, 7))
  })

  it('renders controlled date and month triggers without native date inputs', () => {
    const html = renderToStaticMarkup(
      <>
        <DatePicker ariaLabel="Дата документа" value="2026-11-07" onValueChange={() => undefined} />
        <MonthPicker ariaLabel="Месяц закрытия" value="2026-10" onValueChange={() => undefined} />
      </>,
    )

    expect(html).toContain('07.11.2026')
    expect(html).toContain('октябрь 2026')
    expect(html).not.toContain('type="date"')
    expect(html).not.toContain('type="month"')
  })

  it('renders calendar navigation buttons and selected day', () => {
    const html = renderToStaticMarkup(
      <Calendar mode="single" selected={new Date(2026, 10, 7)} month={new Date(2026, 10, 1)} />,
    )

    expect(html).toContain('Предыдущий месяц')
    expect(html).toContain('Следующий месяц')
    expect(html).toContain('data-selected-single="true"')
  })
})
