import type { ApiError, RequestOptions } from '../../../shared/api'
import type { DocumentData, DocumentDraft } from '../domain/document-draft'

export interface DocumentGateway {
  list(integrationId: number, options?: RequestOptions): Promise<readonly DocumentDraft[]>
  upload(integrationId: number, file: File, options?: RequestOptions): Promise<DocumentDraft>
  update(id: number, data: DocumentData, options?: RequestOptions): Promise<DocumentDraft>
  retry(id: number, options?: RequestOptions): Promise<DocumentDraft>
  write(id: number, options?: RequestOptions): Promise<DocumentDraft>
  remove(id: number, options?: RequestOptions): Promise<void>
}

export type DocumentOperation = {
  readonly kind: 'upload' | 'update' | 'retry' | 'write' | 'remove'
  readonly id?: number
}

export type DocumentState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly integrationId: number }
  | { readonly status: 'error'; readonly integrationId: number; readonly error: Error }
  | {
      readonly status: 'success'
      readonly integrationId: number
      readonly items: readonly DocumentDraft[]
      readonly pending?: DocumentOperation
      readonly mutationError?: Error
    }

type FailureFallback = Extract<DocumentState, { readonly status: 'loading' | 'success' }>

export interface DocumentStore {
  getSnapshot(): DocumentState
  subscribe(listener: () => void): () => void
  load(integrationId: number): Promise<void>
  upload(integrationId: number, file: File): Promise<void>
  update(id: number, data: DocumentData): Promise<void>
  retry(id: number): Promise<void>
  write(id: number): Promise<void>
  remove(id: number): Promise<void>
  reset(): void
}

export function createDocumentStore(gateway: DocumentGateway, session: { expireSession(): void }): DocumentStore {
  let state: DocumentState = { status: 'idle' }
  let revision = 0
  let controller: AbortController | undefined
  let request: Promise<void> | undefined
  let requestKey: string | undefined
  const listeners = new Set<() => void>()

  function publish(next: DocumentState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function fail(error: unknown, currentRevision: number, fallback: FailureFallback): void {
    if (currentRevision !== revision || controller?.signal.aborted) return
    if ((error as ApiError | undefined)?.status === 401) {
      publish({ status: 'idle' })
      session.expireSession()
      return
    }
    publish(fallback.status === 'success'
      ? { ...fallback, pending: undefined, mutationError: normalizeError(error) }
      : { status: 'error', integrationId: fallback.integrationId, error: normalizeError(error) })
  }

  function load(integrationId: number): Promise<void> {
    if (state.status === 'loading' && state.integrationId === integrationId && request) return request
    controller?.abort()
    controller = new AbortController()
    const currentRevision = ++revision
    publish({ status: 'loading', integrationId })
    const operation = gateway.list(integrationId, { signal: controller.signal })
      .then((items) => { if (currentRevision === revision) publish({ status: 'success', integrationId, items }) })
      .catch((error: unknown) => fail(error, currentRevision, { status: 'loading', integrationId }))
      .finally(() => clear(operation))
    request = operation
    requestKey = `load:${integrationId}`
    return operation
  }

  function mutate(
    pending: DocumentOperation,
    action: (signal: AbortSignal) => Promise<DocumentDraft | void>,
    apply: (items: readonly DocumentDraft[], result: DocumentDraft | void) => readonly DocumentDraft[],
  ): Promise<void> {
    if (state.status !== 'success') return Promise.resolve()
    const key = `${pending.kind}:${pending.id ?? state.integrationId}`
    if (requestKey === key && request) return request
    if (request) return Promise.resolve()
    controller = new AbortController()
    const currentRevision = revision
    const fallback = state
    publish({ ...state, pending, mutationError: undefined })
    const operation = action(controller.signal)
      .then((result) => {
        if (currentRevision === revision) publish({ ...fallback, items: apply(fallback.items, result) })
      })
      .catch((error: unknown) => fail(error, currentRevision, fallback))
      .finally(() => clear(operation))
    request = operation
    requestKey = key
    return operation
  }

  function clear(operation: Promise<void>): void {
    if (request === operation) {
      request = undefined
      requestKey = undefined
      controller = undefined
    }
  }

  function replace(items: readonly DocumentDraft[], result: DocumentDraft | void): readonly DocumentDraft[] {
    if (!result) return items
    return items.map((item) => item.id === result.id ? result : item)
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load,
    upload: (integrationId, file) => mutate({ kind: 'upload' }, (signal) => gateway.upload(integrationId, file, { signal }), (items, result) => result ? [result, ...items.filter((item) => item.id !== result.id)] : items),
    update: (id, data) => mutate({ kind: 'update', id }, (signal) => gateway.update(id, data, { signal }), replace),
    retry: (id) => mutate({ kind: 'retry', id }, (signal) => gateway.retry(id, { signal }), replace),
    write: (id) => mutate({ kind: 'write', id }, (signal) => gateway.write(id, { signal }), replace),
    remove: (id) => mutate({ kind: 'remove', id }, (signal) => gateway.remove(id, { signal }), (items) => items.filter((item) => item.id !== id)),
    reset() {
      revision += 1
      controller?.abort()
      request = undefined
      requestKey = undefined
      controller = undefined
      publish({ status: 'idle' })
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Document request failed')
}
