import * as Popover from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { Calendar } from './calendar'
import { dateToValue, monthToValue, valueToDate } from './calendar-value'

type CalendarFieldProps = {
  readonly ariaLabel: string
  readonly name?: string
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly mode?: 'date' | 'month'
}

export function DatePicker(props: Omit<CalendarFieldProps, 'mode'>) {
  return <CalendarField {...props} mode="date" />
}

export function MonthPicker(props: Omit<CalendarFieldProps, 'mode'>) {
  return <CalendarField {...props} mode="month" />
}

function CalendarField({ ariaLabel, name, value, onValueChange, mode = 'date' }: CalendarFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = valueToDate(value)
  const label = selected
    ? format(selected, mode === 'month' ? 'LLLL yyyy' : 'dd.MM.yyyy', { locale: ru })
    : mode === 'month' ? 'Выберите месяц' : 'Выберите дату'

  function select(next: Date | undefined) {
    if (!next) return
    onValueChange(mode === 'month' ? monthToValue(next) : dateToValue(next))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="ui-calendar-trigger" type="button" aria-label={ariaLabel} data-placeholder={!selected}>
          <span>{label}</span><CalendarDays aria-hidden="true" size={17} />
        </button>
      </Popover.Trigger>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover.Portal>
        <Popover.Content className="ui-calendar-popover" align="start" sideOffset={6}>
          <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={select} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
