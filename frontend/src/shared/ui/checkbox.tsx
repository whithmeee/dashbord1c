import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'
import './checkbox.css'

export function Checkbox(props: ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root className="ui-checkbox" {...props}><CheckboxPrimitive.Indicator className="ui-checkbox-indicator"><Check size={14} strokeWidth={3} /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>
}
