import { act, create } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from './calendar'

describe('calendar interactions', () => {
  it('requests the next month from its navigation button', () => {
    const onMonthChange = vi.fn()
    const view = create(
      <Calendar month={new Date(2026, 9, 1)} onMonthChange={onMonthChange} />,
    )

    act(() => view.root.findByProps({ 'aria-label': 'Следующий месяц' }).props.onClick())
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 10, 1))
  })

  it('returns the day selected with a calendar button', () => {
    const onSelect = vi.fn()
    const view = create(
      <Calendar mode="single" month={new Date(2026, 9, 1)} onSelect={onSelect} />,
    )
    const day = view.root.findAll((node) => node.type === 'button' && node.children.join('') === '7')[0]

    act(() => day.props.onClick({ currentTarget: {}, target: {}, preventDefault: vi.fn(), stopPropagation: vi.fn() }))
    expect(onSelect.mock.calls[0][0]).toEqual(new Date(2026, 9, 7))
  })
})
