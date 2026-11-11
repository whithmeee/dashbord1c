import { ApiError } from '../../../shared/api'
import type { AdminGateway } from '../domain/admin-gateway'
import type { Page, Resource } from '../domain/admin'

type Snapshot = Page & {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: Error
  busy: boolean
}
const initial = (): Snapshot => ({
  items: [],
  page: 1,
  lastPage: 1,
  status: 'idle',
  busy: false,
})
export class AdminStore {
  private state = initial()
  private listeners = new Set<() => void>()
  private generation = 0
  private controller?: AbortController
  private key = ''
  private gateway: AdminGateway
  private expire: () => void
  constructor(gateway: AdminGateway, expire: () => void) {
    this.gateway = gateway
    this.expire = expire
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private set(patch: Partial<Snapshot>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener())
  }
  handleError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      this.reset()
      this.expire()
    } else
      this.set({
        error: error instanceof Error ? error : new Error('Ошибка запроса'),
      })
  }
  async load(
    resource: Resource,
    params: Record<string, string>,
    force = false,
  ) {
    const key = JSON.stringify([resource, params])
    if (
      !force &&
      key === this.key &&
      ['loading', 'success'].includes(this.state.status)
    )
      return
    this.controller?.abort()
    const controller = (this.controller = new AbortController())
    const generation = ++this.generation
    this.key = key
    this.set({ status: 'loading', items: [], error: undefined })
    try {
      const result = await this.gateway.list(
        resource,
        params,
        controller.signal,
      )
      if (generation === this.generation)
        this.set({ ...result, status: 'success' })
    } catch (error) {
      if (generation !== this.generation) return
      this.set({ status: 'error' })
      this.handleError(error)
    }
  }
  async mutate<T>(operation: () => Promise<T>): Promise<T | undefined> {
    if (this.state.busy) return
    const generation = this.generation
    this.set({ busy: true, error: undefined })
    try {
      const result = await operation()
      return generation === this.generation ? result : undefined
    } catch (error) {
      if (generation === this.generation) this.handleError(error)
      throw error
    } finally {
      if (generation === this.generation) this.set({ busy: false })
    }
  }
  reset = () => {
    ++this.generation
    this.controller?.abort()
    this.key = ''
    this.state = initial()
    this.listeners.forEach((listener) => listener())
  }
}
