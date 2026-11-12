import { useRef, useState, type ChangeEvent } from 'react'
import { FilePlus2, Upload } from 'lucide-react'
import { Select } from '../../../shared/ui/select'
import type { DocumentData, DocumentDraft } from '../domain/document-draft'
import type { DocumentOperation } from '../application/document-store'
import { DocumentDraftDialog } from './document-draft-dialog'
import { DocumentList } from './document-list'

type IntegrationOption = { readonly id: number; readonly name: string }

export function DocumentWorkspace({ documents, integrations, integrationId, pending, mutationError, onIntegrationChange, onUpload, onUpdate, onRetry, onWrite, onRemove }: {
  documents: readonly DocumentDraft[]
  integrations: readonly IntegrationOption[]
  integrationId: number
  pending: DocumentOperation | undefined
  mutationError?: Error
  onIntegrationChange: (id: number) => void
  onUpload: (file: File) => void
  onUpdate: (id: number, data: DocumentData) => void
  onRetry: (id: number) => void
  onWrite: (id: number) => void
  onRemove: (id: number) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<number>()
  const selected = documents.find((document) => document.id === selectedId)
  const uploading = pending?.kind === 'upload'

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <section className="documents-page" data-testid="documents-page">
      <header className="documents-heading">
        <div><span>ОПЕРАТОР ПЕРВИЧКИ</span><h1>Входящие документы</h1><p>Распознаём первичку, сверяем со справочниками и готовим черновик для 1С.</p></div>
        <div className="documents-actions">
          <label>База 1С<Select ariaLabel="База 1С" value={String(integrationId)} options={integrations.map((item) => ({ value: String(item.id), label: item.name }))} onValueChange={(value) => onIntegrationChange(Number(value))} /></label>
          <input ref={input} className="documents-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={selectFile} />
          <button className="cabinet-button cabinet-button-primary" type="button" disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? <Upload size={17} /> : <FilePlus2 size={17} />}{uploading ? 'Распознаём…' : 'Загрузить документ'}
          </button>
        </div>
      </header>
      <div className="documents-note"><Upload size={20} /><span>PDF, JPG, PNG или TXT до 10 МБ. Документ попадёт в 1С только после вашей проверки.</span></div>
      {mutationError && <p className="documents-error" role="alert">{mutationError.message}</p>}
      <DocumentList documents={documents} onSelect={setSelectedId} />
      <DocumentDraftDialog document={selected} pending={pending} onClose={() => setSelectedId(undefined)} onUpdate={onUpdate} onRetry={onRetry} onWrite={onWrite} onRemove={onRemove} />
    </section>
  )
}
