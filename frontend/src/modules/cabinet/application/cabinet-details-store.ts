import type { ApiError } from '../../../shared/api'
import { allowEverySection, type SectionAccess, type SectionKey } from '../../auth/domain/section-access'
import type { CabinetDetailsGateway } from '../adapters/http/http-cabinet-details-gateway'
import { toMonthKey } from '../domain/cabinet-statistics-period'
import type { CabinetStatistics, CabinetSubscription, CabinetSystemStatus } from '../domain/cabinet-details'

export type CabinetDetailsState =
  | { readonly status: 'idle' | 'loading' }
  | {
      readonly status: 'success'
      readonly systemStatus?: CabinetSystemStatus
      readonly subscription?: CabinetSubscription
      readonly statistics?: CabinetStatistics
    }
  | { readonly status: 'error'; readonly error: Error }

export interface CabinetDetailsStore {
  getSnapshot(): CabinetDetailsState
  subscribe(listener: () => void): () => void
  load(access?: SectionAccess): Promise<void>
  retry(): Promise<void>
  reset(): void
}

export function createCabinetDetailsStore(
  gateway: CabinetDetailsGateway,
  session: { expireSession(): void },
): CabinetDetailsStore {
  let state: CabinetDetailsState = { status: 'idle' }
  let revision = 0
  let request: Promise<void> | undefined
  let controller: AbortController | undefined
  let lastAccess: SectionAccess = allowEverySection
  const listeners = new Set<() => void>()

  const publish = (next: CabinetDetailsState) => {
    state = next
    listeners.forEach((listener) => listener())
  }

  const load = (access: SectionAccess = lastAccess): Promise<void> => {
    if (state.status === 'loading' && request) {
      return request
    }

    lastAccess = access
    const current = ++revision
    controller = new AbortController()
    const signal = controller.signal
    const ifGranted = <Value>(section: SectionKey, fetch: () => Promise<Value>) =>
      access(section) ? fetch() : Promise.resolve(undefined)
    publish({ status: 'loading' })

    const operation = Promise.all([
      ifGranted('system_status', () => gateway.getSystemStatus({ signal })),
      ifGranted('subscription', () => gateway.getSubscription({ signal })),
      ifGranted('analytics', () => gateway.getStatistics({ month: toMonthKey(new Date()) }, { signal })),
    ])
      .then(([systemStatus, subscription, statistics]) => {
        if (revision === current) {
          publish({ status: 'success', systemStatus, subscription, statistics })
        }
      })
      .catch((error: unknown) => {
        if (revision !== current || signal.aborted) {
          return
        }

        if (isUnauthorized(error)) {
          session.expireSession()
        } else {
          publish({ status: 'error', error: normalizeError(error) })
        }
      })
      .finally(() => {
        if (request === operation) {
          request = undefined
          controller = undefined
        }
      })

    request = operation

    return operation
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
    load,
    retry: () => load(),
    reset() {
      revision += 1
      controller?.abort()
      request = undefined
      controller = undefined
      publish({ status: 'idle' })
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Cabinet details request failed')
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}
