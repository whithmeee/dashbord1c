import { Sidebar } from './features/navigation/sidebar/sidebar'
import { useSidebar } from './features/navigation/sidebar/use-sidebar'
import { Chat } from './modules/chat/components/chat'
import { useChat } from './modules/chat/hooks/use-chat'
import { Dashboard } from './modules/dashboard/dashboard'
import './App.css'

function App() {
  const sidebar = useSidebar()
  const chat = useChat()
  const isChatActive = sidebar.isSectionActive('chat')
  const isDashboardActive = sidebar.isSectionActive('dashboards')

  return (
    <div className="application-shell">
      <Sidebar controller={sidebar} />
      <main
        className={`application-content${isChatActive ? ' application-content-chat' : ''}${isDashboardActive ? ' application-content-dashboard' : ''}`}
      >
        {isChatActive ? (
          <Chat controller={chat} />
        ) : isDashboardActive ? (
          <Dashboard onBack={() => sidebar.selectSection('cabinet')} />
        ) : (
          <div className="application-heading">
            <span className="application-eyebrow">Раздел</span>
            <h1>{sidebar.activeSectionLabel}</h1>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
