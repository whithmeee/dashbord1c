import type { ApiError, RequestOptions } from '../../../shared/api'
import type { EmployeesGateway } from '../adapters/http/http-employees-gateway'
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '../domain/employee'
import type { EmployeesState } from './employees-state'

export type { EmployeesMutation, EmployeesState } from './employees-state'

export interface EmployeesSessionDependency {
  expireSession(): void
}

export interface EmployeesStore {
  getSnapshot(): EmployeesState
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  retry(): Promise<void>
  create(input: CreateEmployeeInput): Promise<void>
  update(id: number, input: UpdateEmployeeInput): Promise<void>
  remove(id: number): Promise<void>
  reset(): void
}

export function createEmployeesStore(
  gateway: EmployeesGateway,
  session: EmployeesSessionDependency = { expireSession: () => undefined },
): EmployeesStore {
  let state: EmployeesState = { status: 'idle' }
  let revision = 0
  let listRequest: Promise<void> | undefined
  let listController: AbortController | undefined
  const mutationRequests = new Map<string, Promise<void>>()
  const mutationControllers = new Map<string, AbortController>()
  const listeners = new Set<() => void>()

  function publish(nextState: EmployeesState): void {
    state = nextState
    listeners.forEach((listener) => listener())
  }

  function isCurrent(operationRevision: number): boolean {
    return revision === operationRevision
  }

  function load(): Promise<void> {
    if (state.status === 'loading' && listRequest) {
      return listRequest
    }

    const operationRevision = ++revision
    const controller = new AbortController()
    listController = controller
    publish({ status: 'loading' })
    const request = gateway.list({ signal: controller.signal })
      .then((employees) => {
        if (isCurrent(operationRevision)) {
          publish({ status: 'success', employees })
        }
      })
      .catch((error: unknown) => handleListError(error, operationRevision, controller))
      .finally(() => {
        if (listRequest === request) {
          listRequest = undefined
          listController = undefined
        }
      })
    listRequest = request

    return request
  }

  function handleListError(error: unknown, operationRevision: number, controller: AbortController): void {
    if (!isCurrent(operationRevision) || controller.signal.aborted) {
      return
    }
    if (isUnauthorized(error)) {
      session.expireSession()
      reset()
      return
    }
    publish({ status: 'error', error: normalizeError(error), ...(isUnauthorized(error) ? { sessionExpired: true } : {}) })
  }

  function create(input: CreateEmployeeInput): Promise<void> {
    return mutate('create', undefined, (options) => gateway.create(input, options), (created) => {
      publish({ status: 'success', employees: [...employees(), created], mutation: { status: 'idle' } })
    })
  }

  function update(id: number, input: UpdateEmployeeInput): Promise<void> {
    return mutate('update', id, (options) => gateway.update(id, input, options), (updated) => {
      publish({ status: 'success', employees: employees().map((item) => item.id === id ? updated : item), mutation: { status: 'idle' } })
    })
  }

  function remove(id: number): Promise<void> {
    return mutate('remove', id, (options) => gateway.remove(id, options), () => {
      publish({ status: 'success', employees: employees().filter((item) => item.id !== id), mutation: { status: 'idle' } })
    })
  }

  function mutate<T>(operation: 'create' | 'update' | 'remove', employeeId: number | undefined, request: (options: RequestOptions) => Promise<T>, onSuccess: (value: T) => void): Promise<void> {
    const key = employeeId === undefined ? operation : `${operation}:${employeeId}`
    const existing = mutationRequests.get(key)
    if (existing) {
      return existing
    }

    const operationRevision = revision
    const controller = new AbortController()
    mutationControllers.set(key, controller)
    publish({ ...state, mutation: { status: 'pending', operation, ...(employeeId === undefined ? {} : { employeeId }) } })
    const promise = request({ signal: controller.signal })
      .then((value) => {
        if (isCurrent(operationRevision) && !controller.signal.aborted) {
          onSuccess(value)
        }
      })
      .catch((error: unknown) => handleMutationError(error, operationRevision, controller, operation, employeeId))
      .finally(() => {
        if (mutationRequests.get(key) === promise) {
          mutationRequests.delete(key)
          mutationControllers.delete(key)
        }
      })
    mutationRequests.set(key, promise)

    return promise
  }

  function handleMutationError(error: unknown, operationRevision: number, controller: AbortController, operation: 'create' | 'update' | 'remove', employeeId: number | undefined): void {
    if (!isCurrent(operationRevision) || controller.signal.aborted) {
      return
    }
    if (isUnauthorized(error)) {
      session.expireSession()
      reset()
      return
    }
    const apiError = error as ApiError
    publish({
      ...state,
      mutation: {
        status: 'error',
        operation,
        ...(employeeId === undefined ? {} : { employeeId }),
        error: normalizeError(error),
        ...(apiError.validationErrors ? { validationErrors: apiError.validationErrors } : {}),
      },
    })
  }

  function employees(): readonly Employee[] {
    return state.status === 'success' ? state.employees : []
  }

  function reset(): void {
    revision += 1
    listController?.abort()
    mutationControllers.forEach((controller) => controller.abort())
    listRequest = undefined
    mutationRequests.clear()
    mutationControllers.clear()
    publish({ status: 'idle' })
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load,
    retry: load,
    create,
    update,
    remove,
    reset,
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Employees request failed')
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}
