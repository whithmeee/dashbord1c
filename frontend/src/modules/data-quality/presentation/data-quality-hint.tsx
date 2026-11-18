import * as Popover from '@radix-ui/react-popover'
import { CircleHelp } from 'lucide-react'
import './data-quality-resolution.css'

export function DataQualityHint({ advice }: { advice: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="data-quality-hint" type="button" aria-label="Что нужно сделать в 1С">
          <CircleHelp size={17} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="data-quality-hint-content" side="bottom" align="start" sideOffset={8} collisionPadding={16}>
          <strong>Что нужно сделать в 1С</strong>
          <p>{advice}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
