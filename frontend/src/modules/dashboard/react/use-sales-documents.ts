import { useEffect, useState } from 'react'
import { salesDocumentsSource, type SalesDocumentsQuery } from '../adapters/http/http-sales-documents-source'
import type { SalesDocumentsPage } from '../domain/sales-document'

export type SalesDocumentsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; page: SalesDocumentsPage }
  | { status: 'error'; error: Error }

export function useSalesDocuments(query?: SalesDocumentsQuery): SalesDocumentsState {
  const [state, setState] = useState<SalesDocumentsState>({ status: 'idle' })
  const integrationId = query?.integrationId
  const from = query?.from
  const to = query?.to
  const currencyKey = query?.currencyKey
  const customerKey = query?.customerKey
  const organizationKey = query?.organizationKey
  const page = query?.page
  const perPage = query?.perPage

  useEffect(() => {
    if (integrationId === undefined || !from || !to || !currencyKey) { setState({ status: 'idle' }); return }
    const controller = new AbortController()
    setState({ status: 'loading' })
    void salesDocumentsSource.get({ integrationId, from, to, currencyKey, customerKey, organizationKey, page, perPage }, { signal: controller.signal })
      .then((page) => { if (!controller.signal.aborted) setState({ status: 'success', page }) })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error: error instanceof Error ? error : new Error('Request failed') })
      })
    return () => controller.abort()
  }, [integrationId, from, to, currencyKey, customerKey, organizationKey, page, perPage])

  return state
}
