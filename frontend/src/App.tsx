import { SidebarLayout } from './features/navigation/sidebar/sidebar-layout'
import { SidebarToggle } from './features/navigation/sidebar/sidebar-toggle'
import { MobileNavigation } from './features/navigation/sidebar/mobile-navigation'
import { Sidebar } from './features/navigation/sidebar/sidebar'
import { useSectionAccess } from './modules/auth/react/use-section-access'
import { SectionNotFound } from './features/navigation/section-not-found'
import { useSidebar } from './features/navigation/sidebar/use-sidebar'
import { Chat } from './modules/chat/components/chat'
import { useChat } from './modules/chat/hooks/use-chat'
import { resetChat } from './modules/chat/chat-runtime'
import { Dashboard } from './modules/dashboard/dashboard'
import { Cabinet } from './modules/cabinet/cabinet'
import { resetCabinetDashboard } from './modules/cabinet/cabinet-runtime'
import { DataQualityPage } from './modules/data-quality/presentation/data-quality-page'
import { resetDataQuality } from './modules/data-quality/data-quality-runtime'
import { resetIntegrations } from './modules/integrations/integrations-runtime'
import './App.css'

type AppProps = {
  onLogout: () => Promise<void>
  logoutError?: string
}

function App({ onLogout, logoutError }: AppProps) {
  const access = useSectionAccess()
  const sidebar = useSidebar(access)
  const isActiveSectionVisible = sidebar.visibleSections.some(({ id }) => sidebar.isSectionActive(id))
  const isCabinetActive = sidebar.isSectionActive('cabinet')
  const isChatActive = sidebar.isSectionActive('chat')
  const isDashboardActive = sidebar.isSectionActive('dashboards')
  const isDataQualityActive = sidebar.isSectionActive('data-quality')
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
              resetDataQuality()
              resetIntegrations()
              await onLogout()
            }}
            logoutError={logoutError}
          />
        </SidebarLayout>
        <main
          className={`application-content${isChatActive ? ' application-content-chat' : ''}${isDashboardActive ? ' application-content-dashboard' : ''}${isCabinetActive ? ' application-content-cabinet' : ''}${isDataQualityActive ? ' application-content-data-quality' : ''}`}
        >
          {!isActiveSectionVisible ? (
            <SectionNotFound onBack={() => sidebar.selectSection('cabinet')} />
          ) : isChatActive ? (
            <Chat controller={chat} />
          ) : isDashboardActive ? (
            <Dashboard
              onBack={() => sidebar.selectSection('cabinet')}
              expanded={!sidebar.isSidebarOpen}
              onToggleExpanded={sidebar.toggleSidebar}
            />
          ) : isDataQualityActive ? (
            <DataQualityPage />
          ) : isCabinetActive ? (
            <Cabinet />
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
