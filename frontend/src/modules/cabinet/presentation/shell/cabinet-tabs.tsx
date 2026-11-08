import { LayoutGroup, motion } from 'motion/react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import type { CabinetTab } from '../../domain/cabinet'
import { cabinetTabs } from './cabinet-tabs.config'

export function CabinetTabs({
  active,
  onSelect,
  canManageEmployees,
}: {
  active: CabinetTab
  onSelect: (tab: CabinetTab) => void
  canManageEmployees: boolean
}) {
  const { movement, reducedMotion } = useInterfaceMotion()
  const visibleTabs = cabinetTabs.filter(({ id }) => id !== 'team' || canManageEmployees)

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
        <nav className="cabinet-tabs" role="tablist" aria-label="Разделы личного кабинета">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active === id}
              onClick={() => onSelect(id)}
              data-testid={`cabinet-tab-${id}`}
            >
              {active === id && (
                <motion.span
                  className="cabinet-tab-active-pill"
                  layoutId="cabinet-tab-active-pill"
                  transition={movement}
                  aria-hidden="true"
                />
              )}
              <motion.span
                className="cabinet-tab-content"
                animate={{ transform: active === id && !reducedMotion ? 'scale(1.01)' : 'scale(1)' }}
                transition={movement}
              >
                <Icon size={16} />
                {label}
              </motion.span>
            </button>
          ))}
        </nav>
      </LayoutGroup>
    </>
  )
}
