import { ApiError } from '../../../shared/api'
import type { CabinetDetailsGateway } from '../adapters/http/http-cabinet-details-gateway'
import type { CabinetStatistics } from '../domain/cabinet-details'

export type CabinetStatisticsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly month: string }
  | { readonly status: 'success'; readonly month: string; readonly statistics: CabinetStatistics }
  | { readonly status: 'error'; readonly month: string; readonly error: Error }

export interface CabinetStatisticsStore {
  getSnapshot(): CabinetStatisticsState
  subscribe(listener: () => void): () => void
  load(month: string): Promise<void>
  retry(): Promise<void>
  reset(): void
}

export function createCabinetStatisticsStore(
  gateway: Pick<CabinetDetailsGateway, 'getStatistics'>,
  session: { expireSession(): void },
): CabinetStatisticsStore {
  let state: CabinetStatisticsState = { status: 'idle' }
  let revision = 0
  let controller: AbortController | undefined
  let requestedMonth: string | undefined
  const listeners = new Set<() => void>()

  function publish(next: CabinetStatisticsState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function abortCurrent(): void {
    controller?.abort()
    controller = undefined
  }

  async function load(month: string): Promise<void> {
    abortCurrent()
    const current = ++revision
    const request = new AbortController()
    controller = request
    requestedMonth = month
    publish({ status: 'loading', month })

    try {
      const statistics = await gateway.getStatistics({ month }, { signal: request.signal })

      if (revision === current) {
        publish({ status: 'success', month, statistics })
      }
    } catch (error) {
      if (revision !== current || request.signal.aborted) {
        return
      }

      if (isUnauthorized(error)) {
        session.expireSession()
        return
      }

      publish({ status: 'error', month, error: normalizeError(error) })
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
    load,
    retry: () => (requestedMonth ? load(requestedMonth) : Promise.resolve()),
    reset() {
      revision += 1
      abortCurrent()
      requestedMonth = undefined
      publish({ status: 'idle' })
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Запрос статистики не выполнен')
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}
