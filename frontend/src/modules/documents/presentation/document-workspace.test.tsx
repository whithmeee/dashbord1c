import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { DocumentDraft } from '../domain/document-draft'
import { DocumentWorkspace } from './document-workspace'

const draft = {
  id: 12,
  fileName: 'upd-418.pdf',
  status: 'draft',
  ready: true,
  issues: [],
  data: { type: 'receipt', number: '418', total: 45630, counterparty: { name: 'ООО Ромашка' } },
} as DocumentDraft

describe('document workspace', () => {
  it('renders upload, verified document details and safe 1C action', () => {
    const html = renderToStaticMarkup(
      <DocumentWorkspace
        documents={[draft]}
        integrations={[{ id: 7, name: 'Бухгалтерия' }]}
        integrationId={7}
        pending={undefined}
        onIntegrationChange={() => undefined}
        onUpload={() => undefined}
        onUpdate={() => undefined}
        onRetry={() => undefined}
        onWrite={() => undefined}
        onRemove={() => undefined}
      />,
    )

    expect(html).toContain('Входящие документы')
    expect(html).toContain('Загрузить документ')
    expect(html).toContain('УПД № 418')
    expect(html).toContain('ООО Ромашка')
    expect(html).toContain('45 630')
    expect(html).toContain('Записать в 1С')
    expect(html).not.toContain('Провести')
  })
})
