import { CalendarDays } from 'lucide-react'
import type { CabinetSubscriptionStatus } from '../../domain/cabinet'
import './overview-subscription.css'

const subscriptionStatuses = {
  active: 'Активна',
  inactive: 'Неактивна',
}

export function OverviewSubscription({
  status,
}: {
  status: CabinetSubscriptionStatus
}) {
  return (
    <section className="cabinet-panel" data-testid="cabinet-subscription">
      <div className="cabinet-panel-heading">
        <h2>Подписка</h2>
        <CalendarDays size={20} aria-hidden="true" />
      </div>
      <dl className="cabinet-subscription-details">
        <div>
          <dt>Статус подписки</dt>
          <dd>
            <span
              className="cabinet-subscription-status"
              data-status={status}
            >
              {subscriptionStatuses[status]}
            </span>
          </dd>
        </div>
        <div>
          <dt>Доступ к кабинету</dt>
          <dd>Доступен независимо от статуса подписки</dd>
        </div>
      </dl>
    </section>
  )
}
