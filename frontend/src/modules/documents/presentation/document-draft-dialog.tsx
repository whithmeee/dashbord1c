import { useState } from 'react'
import { AlertTriangle, CheckCircle2, PackagePlus, RotateCcw, Send, Trash2, UserPlus } from 'lucide-react'
import './document-dialog.css'
import { Dialog, DialogContent, DialogFooter } from '../../../shared/ui/dialog'
import type { DocumentData, DocumentDraft } from '../domain/document-draft'
import type { DocumentOperation } from '../application/document-store'
import type { NomenclatureOptions, NomenclatureSpec } from '../domain/nomenclature'
import { canCreateCounterparty } from '../domain/counterparty-rules'
import { CounterpartyDialog } from './counterparty-dialog'
import { DocumentEditor } from './document-editor'
import { DocumentPreview } from './document-preview'
import { NomenclatureDialog } from './nomenclature-dialog'
import { documentStatus, documentTitle } from './document-status'

export function DocumentDraftDialog({ document, pending, onClose, onUpdate, onRetry, onLoadNomenclature, onCreateNomenclature, onCreateCounterparty, onWrite, onRemove }: {
  document: DocumentDraft | undefined
  pending: DocumentOperation | undefined
  onClose: () => void
  onUpdate: (id: number, data: DocumentData) => void
  onRetry: (id: number) => void
  onLoadNomenclature: (id: number, signal: AbortSignal) => Promise<NomenclatureOptions>
  onCreateNomenclature: (id: number, specs: readonly NomenclatureSpec[]) => void
  onCreateCounterparty: (id: number) => void
  onWrite: (id: number) => void
  onRemove: (id: number) => void
}) {
  const [creatingNomenclature, setCreatingNomenclature] = useState(false)
  const [creatingCounterparty, setCreatingCounterparty] = useState(false)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const busy = document !== undefined && pending?.id === document.id
  const missingIndexes = document?.data.items.flatMap((item, index) => item.match === 'missing' && item.name !== '' ? [index] : []) ?? []
  const missingItems = missingIndexes.length
  const status = document ? documentStatus(document) : undefined

  return (
    <Dialog open={document !== undefined} onOpenChange={(open) => { if (!open) onClose() }}>
      {document && status && (
        <DialogContent size="wide" title={documentTitle(document)} description="Проверьте распознанные данные перед записью непроведённого документа в 1С." testId="document-dialog">
          <div className="document-dialog-status">
            <span className={`documents-status documents-status-${status.tone}`}>{status.label}</span>
            <span>{document.fileName}</span>
          </div>
          {document.issues.length > 0 && (
            <div className="document-issues">
              {document.issues.map((issue, index) => (
                <div className={`document-issue document-issue-${issue.level}`} key={`${issue.field}-${index}`}>
                  {issue.level === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}
          {document.status === 'draft' ? (
            <>
              <div className="document-view-switch" role="tablist" aria-label="Режим документа">
                <button type="button" role="tab" aria-selected={view === 'edit'} className={view === 'edit' ? 'active' : ''} onClick={() => setView('edit')}>Редактирование</button>
                <button type="button" role="tab" aria-selected={view === 'preview'} className={view === 'preview' ? 'active' : ''} onClick={() => setView('preview')}>Предпросмотр</button>
              </div>
              <div hidden={view !== 'edit'}>
                <DocumentEditor data={document.data} disabled={busy} onSave={(data) => onUpdate(document.id, data)} />
              </div>
              {view === 'preview' && <DocumentPreview data={document.data} />}
            </>
          ) : (
            <>
              <div className="document-written"><CheckCircle2 size={20} />Документ записан в 1С{document.onecNumber ? ` под номером ${document.onecNumber}` : ''}.</div>
              <DocumentPreview data={document.data} />
            </>
          )}
          <DialogFooter>
            {document.status === 'draft' && canCreateCounterparty(document.data.counterparty) && (
              <button className="cabinet-button" type="button" disabled={busy} onClick={() => setCreatingCounterparty(true)}><UserPlus size={16} />Создать контрагента</button>
            )}
            {document.status === 'draft' && missingItems > 0 && (
              <button className="cabinet-button" type="button" disabled={busy} onClick={() => setCreatingNomenclature(true)}><PackagePlus size={16} />Создать номенклатуру ({missingItems})</button>
            )}
            {document.status === 'draft' && (
              <button className="cabinet-button" type="button" disabled={busy} onClick={() => onRetry(document.id)}><RotateCcw size={16} />Распознать снова</button>
            )}
            <button className="cabinet-button document-delete" type="button" disabled={busy} onClick={() => { onRemove(document.id); onClose() }}><Trash2 size={16} />Удалить</button>
            {document.status === 'draft' && (
              <button className="cabinet-button cabinet-button-primary" type="button" disabled={!document.ready || busy} onClick={() => onWrite(document.id)}><Send size={16} />Записать в 1С</button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
      {document && (
        <CounterpartyDialog
          open={creatingCounterparty}
          party={document.data.counterparty}
          busy={busy}
          onCreate={() => onCreateCounterparty(document.id)}
          onClose={() => setCreatingCounterparty(false)}
        />
      )}
      {document && (
        <NomenclatureDialog
          documentId={document.id}
          open={creatingNomenclature}
          missing={missingIndexes}
          busy={busy}
          load={onLoadNomenclature}
          onCreate={(specs) => onCreateNomenclature(document.id, specs)}
          onClose={() => setCreatingNomenclature(false)}
        />
      )}
    </Dialog>
  )
}
