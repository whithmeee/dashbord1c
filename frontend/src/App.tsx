import { SidebarLayout } from './features/navigation/sidebar/sidebar-layout'
import { SidebarToggle } from './features/navigation/sidebar/sidebar-toggle'
import { MobileNavigation } from './features/navigation/sidebar/mobile-navigation'
import { Sidebar } from './features/navigation/sidebar/sidebar'
import { useSidebar } from './features/navigation/sidebar/use-sidebar'
import { Chat } from './modules/chat/components/chat'
import { useChat } from './modules/chat/hooks/use-chat'
import { resetChat } from './modules/chat/chat-runtime'
import { Dashboard } from './modules/dashboard/dashboard'
import { Cabinet } from './modules/cabinet/cabinet'
import { resetCabinetDashboard } from './modules/cabinet/cabinet-runtime'
import './App.css'

type AppProps = {
  onLogout: () => Promise<void>
  logoutError?: string
}

function App({ onLogout, logoutError }: AppProps) {
  const sidebar = useSidebar()
  const isCabinetActive = sidebar.isSectionActive('cabinet')
  const isChatActive = sidebar.isSectionActive('chat')
  const isDashboardActive = sidebar.isSectionActive('dashboards')
  const chat = useChat(isChatActive)

  return (
    <div className="application-shell">
      <div className="application-body">
        {!sidebar.isSidebarOpen && (
          <div className="sidebar-reopen">
            <SidebarToggle open={false} onToggle={sidebar.toggleSidebar} />
          </div>
        )}
        <SidebarLayout open={sidebar.isSidebarOpen}>
          <Sidebar
            controller={sidebar}
            onLogout={async () => {
              resetCabinetDashboard()
              resetChat()
              await onLogout()
            }}
            logoutError={logoutError}
          />
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
              <p>Раздел скоро появится в приложении</p>
            </div>
          )}
        </main>
      </div>
      <MobileNavigation controller={sidebar} />
    </div>
  )
}

export default App
