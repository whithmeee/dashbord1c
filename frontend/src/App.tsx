import { Sidebar } from './features/navigation/sidebar/sidebar'
import { useSidebar } from './features/navigation/sidebar/use-sidebar'
import { Chat } from './modules/chat/components/chat'
import { useChat } from './modules/chat/hooks/use-chat'
import { Dashboard } from './modules/dashboard/dashboard'
import { Cabinet } from './modules/cabinet/cabinet'
import './App.css'

function App() {
  const sidebar = useSidebar()
  const chat = useChat()
  const isCabinetActive = sidebar.isSectionActive('cabinet')
  const isChatActive = sidebar.isSectionActive('chat')
  const isDashboardActive = sidebar.isSectionActive('dashboards')

  return (
    <div className="application-shell">
      <Sidebar controller={sidebar} />
      <main
        className={`application-content${isChatActive ? ' application-content-chat' : ''}${isDashboardActive ? ' application-content-dashboard' : ''}${isCabinetActive ? ' application-content-cabinet' : ''}`}
      >
        {isChatActive ? (
          <Chat controller={chat} />
        ) : isDashboardActive ? (
          <Dashboard onBack={() => sidebar.selectSection('cabinet')} />
        ) : isCabinetActive ? (
          <Cabinet onOpenChat={() => sidebar.selectSection('chat')} />
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
