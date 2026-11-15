import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AlertCircle, Database, HandCoins, LoaderCircle, RotateCcw } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { useScanProgress } from '../../month-close/presentation/use-scan-progress'
import { receivablesStore } from '../receivables-runtime'
import { ReceivablesWorkspace } from './receivables-workspace'
import '../../month-close/presentation/month-close.css'
import '../../month-close/presentation/month-close-responsive.css'
import './receivables.css'

export function ReceivablesPage() {
  const integrations = useSyncExternalStore(integrationsStore.subscribe, integrationsStore.getSnapshot, integrationsStore.getSnapshot)
  const report = useSyncExternalStore(receivablesStore.subscribe, receivablesStore.getSnapshot, receivablesStore.getSnapshot)
  const [integrationId, setIntegrationId] = useState<number>()
  const [month, setMonth] = useState(currentMonth)
  const active = useMemo(() => integrations.status === 'success' ? integrations.items.filter((item) => item.isActive) : [], [integrations])
  const scanning = report.status === 'loading'
  const progress = useScanProgress(scanning)

  useEffect(() => { void integrationsStore.load() }, [])
  useEffect(() => {
    if (integrationId === undefined && active[0]) setIntegrationId(active[0].id)
  }, [active, integrationId])
  useEffect(() => {
    if (integrationId !== undefined) void receivablesStore.load(integrationId, month)
  }, [integrationId, month])

  if (integrations.status === 'error') return <PageState icon={<AlertCircle />} title="Не удалось загрузить базы 1С" text={describeError(integrations.error)} retry={() => void integrationsStore.retry()} />
  if (integrations.status !== 'success') return <PageState icon={<LoaderCircle className="month-close-spinner" />} title="Загружаем базы 1С" text="Получаем доступные подключения." />
  if (active.length === 0) return <PageState icon={<Database />} title="Нет активных баз 1С" text="Подключите базу, чтобы проверить дебиторскую задолженность." />
  if (report.status === 'error') return <PageState icon={<AlertCircle />} title="Проверка не выполнена" text={describeError(report.error)} retry={() => void receivablesStore.load(report.integrationId, report.month)} />

  const summary = report.status === 'success' ? report.summary : report.status === 'loading' ? report.previous : undefined
  if (!summary || integrationId === undefined) return <PageState icon={<HandCoins />} title="Считаем дебиторку" text={`Сверяем отгрузки и оплаты в 1С · ${progress}%`} progress={progress} />

  return (
    <ReceivablesWorkspace
      summary={summary}
      integrations={active}
      integrationId={integrationId}
      month={month}
      scanning={scanning}
      progress={progress}
      details={report.status === 'success' ? report.details : { status: 'idle' }}
      onIntegrationChange={setIntegrationId}
      onMonthChange={setMonth}
      onScan={() => void receivablesStore.scan()}
      onOpenCheck={(check) => void receivablesStore.openCheck(check)}
      onCloseDetails={receivablesStore.closeDetails}
    />
  )
}

function PageState({ icon, title, text, progress, retry }: { icon: ReactNode; title: string; text: string; progress?: number; retry?: () => void }) {
  return (
    <section className="month-close-state" data-testid="receivables-state">
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
