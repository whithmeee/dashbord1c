import { LayoutGroup, motion } from 'motion/react'
import {
  ArrowLeft,
  ChartNoAxesCombined,
  Library,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import './dashboard-navigation.css'

type DashboardView = 'overview' | 'catalog'

export function DashboardNavigation({
  expanded,
  onToggleExpanded,
  active,
  onSelect,
  onBack,
}: {
  expanded: boolean
  onToggleExpanded: () => void
  active: DashboardView
  onSelect: (view: DashboardView) => void
  onBack: () => void
}) {
  const { movement } = useInterfaceMotion()
  return (
    <div className="dashboard-navigation-wrap">
      <button
        className="dashboard-navigation-back"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft size={16} />В меню
      </button>
      <LayoutGroup id="dashboard-navigation">
        <nav className="dashboard-navigation" aria-label="Разделы дашборда">
          {(
            [
              { id: 'overview', label: 'Обзор', icon: ChartNoAxesCombined },
              { id: 'catalog', label: 'Все отчёты', icon: Library },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              aria-current={active === id ? 'page' : undefined}
              data-testid={`dashboard-view-${id}`}
            >
              <Icon size={17} />
              {label}
              {active === id && (
                <motion.span
                  layoutId="selection"
                  className="dashboard-navigation-selection"
                  transition={movement}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </nav>
      </LayoutGroup>
      <button
        className="dashboard-expand"
        type="button"
        onClick={onToggleExpanded}
        aria-pressed={expanded}
        data-testid="dashboard-expand"
      >
        {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        {expanded ? 'Свернуть' : 'На всю ширину'}
      </button>
    </div>
  )
}
