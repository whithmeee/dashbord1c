import type { CabinetTab } from '../../domain/cabinet'
import { cabinetTabs } from './cabinet-tabs.config'

export function CabinetTabs({
  active,
  onSelect,
}: {
  active: CabinetTab
  onSelect: (tab: CabinetTab) => void
}) {
  return (
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
        </button>
      ))}
    </nav>
  )
}
