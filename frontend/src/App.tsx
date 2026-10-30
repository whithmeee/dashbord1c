import { SidebarLayout } from './features/navigation/sidebar/sidebar-layout'
import { SidebarToggle } from './features/navigation/sidebar/sidebar-toggle'
import { MobileNavigation } from './features/navigation/sidebar/mobile-navigation'
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
      <header className="application-toolbar">
        <div className="application-toolbar-desktop">
          {!sidebar.isSidebarOpen && (
            <SidebarToggle open={false} onToggle={sidebar.toggleSidebar} />
          )}
          <span>{sidebar.activeSectionLabel}</span>
        </div>
        <MobileNavigation controller={sidebar} />
      </header>
      <div className="application-body">
        <SidebarLayout open={sidebar.isSidebarOpen}>
          <Sidebar controller={sidebar} />
        </SidebarLayout>
        <main
          className={`application-content${isChatActive ? ' application-content-chat' : ''}${isDashboardActive ? ' application-content-dashboard' : ''}${isCabinetActive ? ' application-content-cabinet' : ''}`}
        >
          {isChatActive ? (
            <Chat controller={chat} />
          ) : isDashboardActive ? (
            <Dashboard
              onBack={() => sidebar.selectSection('cabinet')}
              expanded={!sidebar.isSidebarOpen}
              onToggleExpanded={sidebar.toggleSidebar}
            />
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
    </div>
  )
}

export default App
