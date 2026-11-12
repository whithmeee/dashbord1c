import { AlertTriangle, CheckCircle2, RotateCcw, Send, Trash2 } from 'lucide-react'
import './document-dialog.css'
import { Dialog, DialogContent, DialogFooter } from '../../../shared/ui/dialog'
import type { DocumentData, DocumentDraft } from '../domain/document-draft'
import type { DocumentOperation } from '../application/document-store'
import { DocumentEditor } from './document-editor'
import { documentStatus, documentTitle } from './document-status'

export function DocumentDraftDialog({ document, pending, onClose, onUpdate, onRetry, onWrite, onRemove }: {
  document: DocumentDraft | undefined
  pending: DocumentOperation | undefined
  onClose: () => void
  onUpdate: (id: number, data: DocumentData) => void
  onRetry: (id: number) => void
  onWrite: (id: number) => void
  onRemove: (id: number) => void
}) {
  const busy = document !== undefined && pending?.id === document.id
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
            <DocumentEditor data={document.data} disabled={busy} onSave={(data) => onUpdate(document.id, data)} />
          ) : (
            <div className="document-written"><CheckCircle2 size={20} />Документ записан в 1С{document.onecNumber ? ` под номером ${document.onecNumber}` : ''}.</div>
          )}
          <DialogFooter>
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
    </Dialog>
  )
}
