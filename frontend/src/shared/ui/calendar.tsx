import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayButton } from 'react-day-picker'
import { ru } from 'date-fns/locale'
import type { ComponentProps } from 'react'
import 'react-day-picker/style.css'
import './calendar.css'

export function Calendar(props: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ru}
      showOutsideDays
      labels={{
        labelPrevious: () => 'Предыдущий месяц',
        labelNext: () => 'Следующий месяц',
      }}
      components={{
        Chevron: ({ orientation }) => orientation === 'left'
          ? <ChevronLeft size={16} />
          : orientation === 'right' ? <ChevronRight size={16} /> : <ChevronDown size={16} />,
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({ day, modifiers, ...props }: ComponentProps<typeof DayButton>) {
  return <button {...props} data-selected-single={modifiers.selected || undefined}>{day.date.getDate()}</button>
}
