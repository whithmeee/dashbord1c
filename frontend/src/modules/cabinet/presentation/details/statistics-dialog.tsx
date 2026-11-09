import { useEffect, useState, useSyncExternalStore } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, RotateCcw } from 'lucide-react'
import { describeError } from '../../../../shared/api'
import { cabinetStatisticsStore } from '../../cabinet-statistics-runtime'
import {
  formatMonthLabel,
  isFutureMonth,
  shiftMonth,
  toMonthKey,
} from '../../domain/cabinet-statistics-period'
import { CabinetDialog } from './cabinet-dialog'
import './statistics-dialog.css'
import { StatisticsReport } from './statistics-report'

export function StatisticsDialog({ onClose }: { onClose: () => void }) {
  const state = useSyncExternalStore(
    cabinetStatisticsStore.subscribe,
    cabinetStatisticsStore.getSnapshot,
    cabinetStatisticsStore.getSnapshot,
  )
  const [month, setMonth] = useState(() => toMonthKey(new Date()))

  useEffect(() => {
    void cabinetStatisticsStore.load(month)
  }, [month])

  useEffect(() => () => cabinetStatisticsStore.reset(), [])

  const canGoForward = !isFutureMonth(shiftMonth(month, 1), new Date())

  return (
    <CabinetDialog title="Запросы к ИИ" testId="statistics-dialog" size="large" onClose={onClose}>
      <div className="statistics-month-switch">
        <button
          className="cabinet-button"
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <strong data-testid="statistics-month">{formatMonthLabel(month)}</strong>
        <button
          className="cabinet-button"
          type="button"
          aria-label="Следующий месяц"
          disabled={!canGoForward}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      {state.status === 'success' && state.month === month && (
        <StatisticsReport statistics={state.statistics} />
      )}
      {state.status === 'error' && (
        <div className="cabinet-dialog-state" role="alert" data-testid="statistics-error">
          <AlertCircle size={22} aria-hidden="true" />
          <p>{describeError(state.error)}</p>
          <button
            className="cabinet-button cabinet-button-primary"
            type="button"
            onClick={() => void cabinetStatisticsStore.retry()}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Повторить
          </button>
        </div>
      )}
      {(state.status === 'idle' || state.status === 'loading' || (state.status === 'success' && state.month !== month)) && (
        <div className="cabinet-dialog-state" data-testid="statistics-loading">
          <LoaderCircle className="cabinet-dialog-spinner" size={22} aria-hidden="true" />
          <p>Загружаем статистику…</p>
        </div>
      )}
    </CabinetDialog>
  )
}
