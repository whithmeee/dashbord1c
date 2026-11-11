import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { AdminGateway } from '../domain/admin-gateway'
import { AdminStore } from '../application/admin-store'
import type { AdminRecord, Resource } from '../domain/admin'

type Action =
  { kind: 'edit' | 'delete' | 'reset'; item: AdminRecord } | { kind: 'create' }
export function useAdminResource(
  resource: Resource,
  gateway: AdminGateway,
  expire: () => void,
) {
  const [store] = useState(() => new AdminStore(gateway, expire))
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const [params, setParams] = useState<Record<string, string>>({ page: '1' })
  const [action, setAction] = useState<Action>()
  const [secret, setSecret] = useState<string>()
  const [info, setInfo] = useState<{ title: string; rows: string[] }>()
  const alive = useRef(true)
  const [lifecycle] = useState(() => ({ revision: 0 }))
  useEffect(() => {
    alive.current = true
    const version = ++lifecycle.revision
    return () => {
      alive.current = false
      queueMicrotask(() => {
        if (version === lifecycle.revision) store.reset()
      })
    }
  }, [store, lifecycle])
  useEffect(() => {
    void store.load(resource, params)
  }, [store, resource, params])
  async function run(operation: () => Promise<unknown>, refresh = false) {
    if (store.getSnapshot().busy) return
    try {
      await store.mutate(async () => {
        const result = await operation()
        if (!alive.current) return
        if (refresh) setAction(undefined)
        if (typeof result === 'string') setSecret(result)
      })
      if (refresh && alive.current) await store.load(resource, params, true)
    } catch {
      return
    }
  }
  function edit(item: AdminRecord) {
    void run(async () => {
      const detail =
        resource === 'integrations'
          ? item
          : await gateway.detail(resource, item.id)
      if (alive.current) setAction({ kind: 'edit', item: detail })
    })
  }

  function employees(item: AdminRecord) {
    void run(async () => {
      const rows = await gateway.employees(item.id)
      if (alive.current)
        setInfo({
          title: `Сотрудники: ${item.name}`,
          rows: rows.map(
            (employee) =>
              `${employee.name} · ${employee.position} · ${employee.login}`,
          ),
        })
    })
  }
  function test(item: AdminRecord) {
    void run(async () => {
      await gateway.test(item.id)
      if (alive.current)
        setInfo({ title: item.name, rows: ['Соединение с 1С подтверждено.'] })
    })
  }
  return {
    state,
    params,
    setParams,
    action,
    setAction,
    secret,
    setSecret,
    info,
    setInfo,
    run,
    edit,
    employees,
    test,
    refresh: () => store.load(resource, params, true),
  }
}
export type ResourceController = ReturnType<typeof useAdminResource>
