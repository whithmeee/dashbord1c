import { CalendarDays } from 'lucide-react'
import type { CabinetOverview } from '../../domain/cabinet'
import './overview-subscription.css'

const subscriptionStatuses = {
  active: 'Активна',
  expired: 'Истекла',
}

const subscriptionDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function OverviewSubscription({
  subscription,
}: {
  subscription: CabinetOverview['subscription']
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
              data-status={subscription.status}
            >
              {subscriptionStatuses[subscription.status]}
            </span>
          </dd>
        </div>
        <div>
          <dt>Действует до</dt>
          <dd>
            <time dateTime={subscription.validUntil}>
              {subscriptionDate.format(new Date(subscription.validUntil))}
            </time>
          </dd>
        </div>
      </dl>
    </section>
  )
}
