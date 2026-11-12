import { authSessionStore } from '../auth/react/auth-runtime'
import { documentGateway } from './adapters/http-document-gateway'
import { createDocumentStore } from './application/document-store'

export const documentStore = createDocumentStore(documentGateway, authSessionStore)

export function resetDocuments(): void {
  documentStore.reset()
}
