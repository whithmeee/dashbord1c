import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AlertCircle, FileStack, LoaderCircle, RotateCcw } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { documentStore } from '../documents-runtime'
import { DocumentWorkspace } from './document-workspace'
import './documents.css'
import './documents-responsive.css'

export function DocumentsPage() {
  const integrations = useSyncExternalStore(integrationsStore.subscribe, integrationsStore.getSnapshot, integrationsStore.getSnapshot)
  const documents = useSyncExternalStore(documentStore.subscribe, documentStore.getSnapshot, documentStore.getSnapshot)
  const [integrationId, setIntegrationId] = useState<number>()

  useEffect(() => { void integrationsStore.load() }, [])
  const active = useMemo(
    () => integrations.status === 'success' ? integrations.items.filter((item) => item.isActive) : [],
    [integrations],
  )

  useEffect(() => {
    if (integrationId === undefined && active[0]) setIntegrationId(active[0].id)
  }, [active, integrationId])

  useEffect(() => {
    if (integrationId !== undefined) void documentStore.load(integrationId)
  }, [integrationId])

  if (integrations.status === 'error') return <PageState icon={<AlertCircle />} title="Не удалось загрузить базы 1С" text={describeError(integrations.error)} retry={() => void integrationsStore.retry()} />
  if (integrations.status !== 'success') return <PageState icon={<LoaderCircle className="documents-spinner" />} title="Загружаем базы 1С" text="Получаем доступные подключения." />
  if (active.length === 0) return <PageState icon={<FileStack />} title="Нет активных баз 1С" text="Подключите базу перед загрузкой документов." />
  if (documents.status === 'error') return <PageState icon={<AlertCircle />} title="Документы не загружены" text={describeError(documents.error)} retry={() => void documentStore.load(documents.integrationId)} />
  if (documents.status !== 'success' || integrationId === undefined || documents.integrationId !== integrationId) return <PageState icon={<LoaderCircle className="documents-spinner" />} title="Загружаем документы" text="Получаем ваши черновики." />

  return (
    <DocumentWorkspace
      documents={documents.items}
      integrations={active}
      integrationId={integrationId}
      pending={documents.pending}
      mutationError={documents.mutationError}
      onIntegrationChange={setIntegrationId}
      onUpload={(file) => void documentStore.upload(integrationId, file)}
      onUpdate={(id, data) => void documentStore.update(id, data)}
      onRetry={(id) => void documentStore.retry(id)}
      onWrite={(id) => void documentStore.write(id)}
      onRemove={(id) => void documentStore.remove(id)}
    />
  )
}

function PageState({ icon, title, text, retry }: { icon: ReactNode; title: string; text: string; retry?: () => void }) {
  return (
    <section className="documents-state" data-testid="documents-state">
      {icon}<h2>{title}</h2><p>{text}</p>
      {retry && <button className="cabinet-button cabinet-button-primary" type="button" onClick={retry}><RotateCcw size={16} />Повторить</button>}
    </section>
  )
}
