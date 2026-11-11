import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import './select.css'

export type SelectOption = {
  readonly value: string
  readonly label: string
}

export function Select({
  value,
  options,
  ariaLabel,
  onValueChange,
}: {
  value: string
  options: readonly SelectOption[]
  ariaLabel: string
  onValueChange: (value: string) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="ui-select-trigger" aria-label={ariaLabel}>
        <SelectPrimitive.Value>{selectedLabel}</SelectPrimitive.Value>
        <SelectPrimitive.Icon className="ui-select-icon"><ChevronDown size={16} /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={6}>
          <SelectPrimitive.Viewport className="ui-select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item className="ui-select-item" key={option.value} value={option.value}>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ui-select-indicator"><Check size={15} /></SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
