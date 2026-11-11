import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AlertCircle, Database, LoaderCircle, RotateCcw } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { dataQualityStore } from '../data-quality-runtime'
import { DataQualityReportView } from './data-quality-report-view'
import './data-quality.css'
import './data-quality-responsive.css'

export function DataQualityPage() {
  const integrations = useSyncExternalStore(integrationsStore.subscribe, integrationsStore.getSnapshot, integrationsStore.getSnapshot)
  const quality = useSyncExternalStore(dataQualityStore.subscribe, dataQualityStore.getSnapshot, dataQualityStore.getSnapshot)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number>()

  useEffect(() => { void integrationsStore.load() }, [])
  const activeIntegrations = useMemo(
    () => integrations.status === 'success' ? integrations.items.filter((item) => item.isActive) : [],
    [integrations],
  )

  useEffect(() => {
    if (selectedIntegrationId === undefined && activeIntegrations[0]) setSelectedIntegrationId(activeIntegrations[0].id)
  }, [activeIntegrations, selectedIntegrationId])

  useEffect(() => {
    if (selectedIntegrationId !== undefined) void dataQualityStore.load(selectedIntegrationId)
  }, [selectedIntegrationId])

  if (integrations.status === 'error') return <State icon={<AlertCircle />} title="Не удалось загрузить базы 1С" text={describeError(integrations.error)} retry={() => void integrationsStore.retry()} />
  if (integrations.status !== 'success') return <State icon={<LoaderCircle className="data-quality-spinner" />} title="Загружаем базы 1С" text="Получаем доступные подключения." />
  if (activeIntegrations.length === 0) return <State icon={<Database />} title="Нет активных баз 1С" text="Подключите базу, чтобы запустить контроль данных." />
  if (quality.status === 'error') return <State icon={<AlertCircle />} title="Проверка не выполнена" text={describeError(quality.error)} retry={() => void dataQualityStore.load(quality.integrationId)} />
  if (quality.status !== 'success' || selectedIntegrationId === undefined || quality.report.summary.integrationId !== selectedIntegrationId) return <State icon={<LoaderCircle className="data-quality-spinner" />} title="Проверяем данные" text="Читаем карточки и договоры из 1С." />

  return <DataQualityReportView report={quality.report} integrations={activeIntegrations} selectedIntegrationId={selectedIntegrationId} onSelect={setSelectedIntegrationId} onRefresh={() => void dataQualityStore.refresh()} />
}

function State({ icon, title, text, retry }: { icon: React.ReactNode; title: string; text: string; retry?: () => void }) {
  return <section className="data-quality-state" data-testid="data-quality-state">{icon}<h2>{title}</h2><p>{text}</p>{retry && <button className="cabinet-button cabinet-button-primary" type="button" onClick={retry}><RotateCcw size={16} />Повторить</button>}</section>
}
