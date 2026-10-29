import { ArrowRight, CalendarDays, Gem } from 'lucide-react'
import type { CabinetOverview, CabinetTab } from '../../domain/cabinet'

type OverviewAccessProps = {
  subscription: CabinetOverview['subscription']
  plan: CabinetOverview['plan']
  onSelectTab: (tab: CabinetTab) => void
}

export function OverviewAccess({
  subscription,
  plan,
  onSelectTab,
}: OverviewAccessProps) {
  return (
    <>
      <section className="cabinet-panel">
        <div className="cabinet-panel-heading">
          <h2>Подписка</h2>
          <CalendarDays size={18} />
        </div>
        <div className="cabinet-access-row">
          <span>Кабинет</span>
          <span className="cabinet-badge">{subscription.label}</span>
        </div>
        <p>До {subscription.validUntil}</p>
        <strong className="cabinet-access-value">
          Осталось дней: {subscription.daysRemaining}
        </strong>
        <button
          className="cabinet-detail-link"
          type="button"
          onClick={() => onSelectTab('subscription')}
        >
          Подробнее <ArrowRight size={16} />
        </button>
      </section>
      <section className="cabinet-panel">
        <div className="cabinet-panel-heading">
          <h2>Тариф</h2>
          <Gem size={18} />
        </div>
        <div className="cabinet-access-row">
          <span>Кабинет</span>
          <span className="cabinet-plan-name">{plan.name}</span>
        </div>
        <strong className="cabinet-access-value">
          Возможностей: {plan.availableFeatures} из {plan.totalFeatures}
        </strong>
        <button
          className="cabinet-detail-link"
          type="button"
          onClick={() => onSelectTab('plan')}
        >
          Подробнее <ArrowRight size={16} />
        </button>
      </section>
    </>
  )
}
