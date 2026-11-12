import type { DocumentDraft } from '../domain/document-draft'

export function documentTitle(document: DocumentDraft): string {
  const type = document.data.type === 'invoice' ? 'Счёт' : 'УПД'
  return document.data.number ? `${type} № ${document.data.number}` : document.fileName
}

export function documentStatus(document: DocumentDraft): { label: string; tone: string } {
  if (document.status === 'written') return { label: 'Записан в 1С', tone: 'written' }
  if (document.issues.some((issue) => issue.level === 'error')) return { label: 'Нужны исправления', tone: 'error' }
  if (document.issues.length > 0) return { label: 'Проверьте', tone: 'warning' }
  return { label: 'Готов к записи', tone: 'ready' }
}

export function formatDocumentAmount(value: number): string {
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}
