import { Sidebar } from './features/navigation/sidebar/sidebar'
import { useSidebar } from './features/navigation/sidebar/use-sidebar'
import './App.css'

function App() {
  const sidebar = useSidebar()

  return (
    <div className="application-shell">
      <Sidebar controller={sidebar} />
      <main className="application-content">
        <div className="application-heading">
          <span className="application-eyebrow">Раздел</span>
          <h1>{sidebar.activeSectionLabel}</h1>
        </div>
      </main>
    </div>
  )
}

export default App
