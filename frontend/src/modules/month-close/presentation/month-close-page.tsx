import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AlertCircle, CalendarClock, Database, LoaderCircle, RotateCcw } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { monthCloseStore } from '../month-close-runtime'
import { MonthCloseWorkspace } from './month-close-workspace'
import { useScanProgress } from './use-scan-progress'
import './month-close.css'
import './month-close-responsive.css'

export function MonthClosePage() {
  const integrations = useSyncExternalStore(integrationsStore.subscribe, integrationsStore.getSnapshot, integrationsStore.getSnapshot)
  const closing = useSyncExternalStore(monthCloseStore.subscribe, monthCloseStore.getSnapshot, monthCloseStore.getSnapshot)
  const [integrationId, setIntegrationId] = useState<number>()
  const [month, setMonth] = useState(currentMonth)
  const active = useMemo(() => integrations.status === 'success' ? integrations.items.filter((item) => item.isActive) : [], [integrations])
  const scanning = closing.status === 'loading'
  const progress = useScanProgress(scanning)

  useEffect(() => { void integrationsStore.load() }, [])
  useEffect(() => {
    if (integrationId === undefined && active[0]) setIntegrationId(active[0].id)
  }, [active, integrationId])
  useEffect(() => {
    if (integrationId !== undefined) void monthCloseStore.load(integrationId, month)
  }, [integrationId, month])

  if (integrations.status === 'error') return <PageState icon={<AlertCircle />} title="Не удалось загрузить базы 1С" text={describeError(integrations.error)} retry={() => void integrationsStore.retry()} />
  if (integrations.status !== 'success') return <PageState icon={<LoaderCircle className="month-close-spinner" />} title="Загружаем базы 1С" text="Получаем доступные подключения." />
  if (active.length === 0) return <PageState icon={<Database />} title="Нет активных баз 1С" text="Подключите базу, чтобы проверить готовность месяца." />
  if (closing.status === 'error') return <PageState icon={<AlertCircle />} title="Проверка не выполнена" text={describeError(closing.error)} retry={() => void monthCloseStore.load(closing.integrationId, closing.month)} />

  const summary = closing.status === 'success' ? closing.summary : closing.status === 'loading' ? closing.previous : undefined
  if (!summary || integrationId === undefined) return <PageState icon={<CalendarClock />} title="Проверяем месяц" text={`Сканируем документы из 1С · ${progress}%`} progress={progress} />

  return (
    <MonthCloseWorkspace
      summary={summary}
      integrations={active}
      integrationId={integrationId}
      month={month}
      scanning={scanning}
      progress={progress}
      details={closing.status === 'success' ? closing.details : { status: 'idle' }}
      onIntegrationChange={setIntegrationId}
      onMonthChange={setMonth}
      onScan={() => void monthCloseStore.scan()}
      onOpenCheck={(check) => void monthCloseStore.openCheck(check)}
      onCloseDetails={monthCloseStore.closeDetails}
    />
  )
}

function PageState({ icon, title, text, progress, retry }: { icon: ReactNode; title: string; text: string; progress?: number; retry?: () => void }) {
  return (
    <section className="month-close-state" data-testid="month-close-state">
      {icon}<h2>{title}</h2><p>{text}</p>
      {progress !== undefined && <div className="month-close-progress"><span style={{ width: `${progress}%` }} /></div>}
      {retry && <button className="cabinet-button cabinet-button-primary" type="button" onClick={retry}><RotateCcw size={16} />Повторить</button>}
    </section>
  )
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
