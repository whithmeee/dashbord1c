import { ChevronRight, FileCheck2, FileWarning } from 'lucide-react'
import type { DocumentDraft } from '../domain/document-draft'
import { documentStatus, documentTitle, formatDocumentAmount } from './document-status'

export function DocumentList({ documents, onSelect }: {
  documents: readonly DocumentDraft[]
  onSelect: (id: number) => void
}) {
  if (documents.length === 0) {
    return (
      <div className="documents-empty">
        <FileCheck2 size={30} />
        <h2>Документов пока нет</h2>
        <p>Загрузите УПД, счёт, накладную или акт для распознавания.</p>
      </div>
    )
  }

  return (
    <div className="documents-list" data-testid="document-list">
      <div className="documents-list-head">
        <span>Документ</span><span>Контрагент</span><span>Сумма</span><span>Статус</span><span />
      </div>
      {documents.map((document) => {
        const status = documentStatus(document)
        return (
          <button type="button" className="documents-row" onClick={() => onSelect(document.id)} key={document.id}>
            <span className="documents-main-cell">
              {document.ready || document.status === 'written' ? <FileCheck2 size={20} /> : <FileWarning size={20} />}
              <span><strong>{documentTitle(document)}</strong><small>{document.fileName}</small></span>
            </span>
            <span>{document.data.counterparty.name || 'Не распознан'}</span>
            <strong>{formatDocumentAmount(document.data.total)}</strong>
            <span><span className={`documents-status documents-status-${status.tone}`}>{status.label}</span></span>
            <ChevronRight size={18} />
          </button>
        )
      })}
    </div>
  )
}
