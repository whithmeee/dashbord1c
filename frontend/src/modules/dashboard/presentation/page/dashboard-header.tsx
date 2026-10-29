import { ArrowLeft, RefreshCw } from 'lucide-react'

type DashboardHeaderProps = {
  onBack: () => void
  onRefresh: () => void
  isLoading: boolean
}

export function DashboardHeader({
  onBack,
  onRefresh,
  isLoading,
}: DashboardHeaderProps) {
  return (
    <>
      <button className="dashboard-back" onClick={onBack} type="button">
        <ArrowLeft size={16} /> В меню
      </button>
      <header className="dashboard-header">
        <div>
          <span className="application-eyebrow">Обзор бизнеса</span>
          <h1>Дашборды</h1>
          <p>Главные цифры — перед глазами</p>
        </div>
        <button
          className="dashboard-refresh"
          onClick={onRefresh}
          type="button"
          disabled={isLoading}
          data-testid="dashboard-refresh"
        >
          <RefreshCw size={16} /> Обновить
        </button>
      </header>
    </>
  )
}
