import { CircleAlert, CircleCheck, ChevronRight, TriangleAlert } from 'lucide-react'
import type { MonthCloseCheck } from '../domain/month-close'

export function MonthCloseChecks({ checks, onOpen }: {
  checks: readonly MonthCloseCheck[]
  onOpen: (check: string) => void
}) {
  return (
    <section className="month-close-checks">
      <div className="month-close-section-heading">
        <div><span>КОНТРОЛЬНЫЕ ТОЧКИ</span><h2>Что проверить перед закрытием</h2></div>
        <p>Нажмите на проверку, чтобы посмотреть документы.</p>
      </div>
      <div className="month-close-check-grid">
        {checks.map((check) => {
          const Icon = check.status === 'ok' ? CircleCheck : check.status === 'critical' ? CircleAlert : TriangleAlert
          return (
            <button
              className={`month-close-check month-close-check-${check.status}`}
              type="button"
              disabled={check.count === 0}
              onClick={() => onOpen(check.key)}
              key={check.key}
            >
              <span className="month-close-check-icon"><Icon size={20} /></span>
              <span><strong>{check.label}</strong><small>{check.count === 0 ? 'Замечаний нет' : `Найдено документов: ${check.count}`}</small></span>
              <b>{check.count}</b>
              {check.count > 0 && <ChevronRight size={18} />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
