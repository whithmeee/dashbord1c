import { useMemo, useState } from 'react'
import { createLoadDashboard } from './application/load-dashboard'
import {
  createDemoDashboardSource,
  type DemoScenario,
} from './adapters/demo/demo-dashboard-source'
import { DemoControls, DemoNotice } from './adapters/demo/demo-controls'
import { DashboardPage } from './presentation/page/dashboard-page'

export function Dashboard({ onBack }: { onBack: () => void }) {
  const [scenario, setScenario] = useState<DemoScenario>('ready')
  const loadDashboard = useMemo(
    () => createLoadDashboard(createDemoDashboardSource(scenario)),
    [scenario],
  )

  return (
    <DashboardPage
      loadDashboard={loadDashboard}
      onBack={onBack}
      notice={<DemoNotice />}
      footer={
        <DemoControls scenario={scenario} onSelectScenario={setScenario} />
      }
    />
  )
}
