import type { DashboardSource } from '../../application/load-dashboard'
import { demoReports } from './demo-reports'

export type DemoScenario = 'ready' | 'empty' | 'error'

function waitForDemoResponse(signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timer = setTimeout(finish, 450)
    signal.addEventListener('abort', finish, { once: true })
    if (signal.aborted) finish()
  })
}

export function createDemoDashboardSource(
  scenario: DemoScenario,
): DashboardSource {
  return async (period, signal) => {
    await waitForDemoResponse(signal)
    switch (scenario) {
      case 'empty':
        return { status: 'empty' }
      case 'error':
        return {
          status: 'error',
          message: 'Не удалось загрузить статистику. Попробуйте ещё раз.',
        }
      case 'ready':
        return { status: 'ready', report: demoReports[period] }
    }
  }
}
