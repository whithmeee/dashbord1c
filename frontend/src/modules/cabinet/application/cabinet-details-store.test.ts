import { describe, expect, it, vi } from 'vitest'
import type { CabinetDetailsGateway } from '../adapters/http/http-cabinet-details-gateway'
import type { CabinetStatistics, CabinetSubscription, CabinetSystemStatus } from '../domain/cabinet-details'
import { createCabinetDetailsStore } from './cabinet-details-store'

const systemStatus = { status: 'operational' } as CabinetSystemStatus
const subscription = { status: 'active' } as CabinetSubscription
const statistics = { total: 4 } as CabinetStatistics

function createGateway(): CabinetDetailsGateway {
  return {
    getSystemStatus: vi.fn().mockResolvedValue(systemStatus),
    getSubscription: vi.fn().mockResolvedValue(subscription),
    getStatistics: vi.fn().mockResolvedValue(statistics),
  } as unknown as CabinetDetailsGateway
}

describe('cabinet details store', () => {
  it('loads every detail when all sections are open', async () => {
    const store = createCabinetDetailsStore(createGateway(), { expireSession: vi.fn() })

    await store.load()

    expect(store.getSnapshot()).toEqual({ status: 'success', systemStatus, subscription, statistics })
  })

  it('does not request the details of closed sections', async () => {
    const gateway = createGateway()
    const store = createCabinetDetailsStore(gateway, { expireSession: vi.fn() })

    await store.load((section) => section === 'subscription')

    expect(gateway.getSystemStatus).not.toHaveBeenCalled()
    expect(gateway.getStatistics).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toEqual({
      status: 'success',
      systemStatus: undefined,
      subscription,
      statistics: undefined,
    })
  })

  it('keeps the granted sections when the load is retried', async () => {
    const gateway = createGateway()
    const store = createCabinetDetailsStore(gateway, { expireSession: vi.fn() })

    await store.load((section) => section === 'subscription')
    await store.retry()

    expect(gateway.getSubscription).toHaveBeenCalledTimes(2)
    expect(gateway.getStatistics).not.toHaveBeenCalled()
  })
})
