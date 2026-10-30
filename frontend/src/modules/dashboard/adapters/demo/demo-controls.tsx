import { FlaskConical } from 'lucide-react'
import type { DemoScenario } from './demo-dashboard-source'

const scenarios: { id: DemoScenario; label: string }[] = [
  { id: 'ready', label: 'С данными' },
  { id: 'empty', label: 'Нет данных' },
  { id: 'error', label: 'Ошибка' },
]

export function DemoNotice() {
  return (
    <div className="dashboard-demo">
      <FlaskConical size={18} />
      <span>
        <strong>Демоданные</strong> · Без подключения к 1С
      </span>
    </div>
  )
}

export function DemoControls({
  scenario,
  onSelectScenario,
}: {
  scenario: DemoScenario
  onSelectScenario: (scenario: DemoScenario) => void
}) {
  return (
    <footer className="dashboard-demo-controls">
      <span>Проверка демосостояний</span>
      <div role="group" aria-label="Демосостояние">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === scenario}
            onClick={() => onSelectScenario(item.id)}
            data-testid={`demo-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </footer>
  )
}
