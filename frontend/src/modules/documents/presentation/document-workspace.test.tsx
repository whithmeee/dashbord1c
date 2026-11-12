import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { DocumentDraftDialog } from './document-draft-dialog'
import { DocumentWorkspace } from './document-workspace'

const draft = mapDocumentDraft({
  ...draftResponse,
  file_name: 'upd-418.pdf',
  data: { ...draftResponse.data, total: 45630 },
})

describe('document workspace', () => {
  it('renders upload and verified document details', () => {
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
    expect(html).not.toContain('Провести')
  })

  it('offers writing a checked draft without posting it', () => {
    const html = renderToStaticMarkup(
      <DocumentDraftDialog
        document={draft}
        pending={undefined}
        onClose={() => undefined}
        onUpdate={() => undefined}
        onRetry={() => undefined}
        onWrite={() => undefined}
        onRemove={() => undefined}
      />,
    )

    expect(html).toContain('Записать в 1С')
    expect(html).not.toContain('Провести')
  })
})
