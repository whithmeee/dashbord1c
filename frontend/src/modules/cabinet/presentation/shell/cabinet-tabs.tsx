import { LayoutGroup, motion } from 'motion/react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import type { CabinetTab } from '../../domain/cabinet'
import { cabinetTabs } from './cabinet-tabs.config'

export function CabinetTabs({
  active,
  onSelect,
}: {
  active: CabinetTab
  onSelect: (tab: CabinetTab) => void
}) {
  const { movement } = useInterfaceMotion()

  return (
    <>
      <label className="cabinet-tab-picker">
        <span>Раздел кабинета</span>
        <select
          value={active}
          data-testid="cabinet-tab-picker"
          onChange={(event) => {
            const tab = cabinetTabs.find(({ id }) => id === event.target.value)
            if (tab) onSelect(tab.id)
          }}
        >
          {cabinetTabs.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <LayoutGroup id="cabinet-tabs">
        <nav className="cabinet-tabs" aria-label="Разделы личного кабинета">
          {cabinetTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={active === id ? 'page' : undefined}
              onClick={() => onSelect(id)}
              data-testid={`cabinet-tab-${id}`}
            >
              <Icon size={16} />
              {label}
              {active === id && (
                <motion.span
                  className="cabinet-tab-indicator"
                  layoutId="indicator"
                  transition={movement}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </nav>
      </LayoutGroup>
    </>
  )
}
