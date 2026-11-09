import { AlertTriangle } from 'lucide-react'
import type { CabinetSubscription, CabinetSubscriptionState } from '../../domain/cabinet-details'
import { formatCalendarDate, formatDayCount } from '../../domain/cabinet-statistics-period'
import { CabinetDialog } from './cabinet-dialog'

const stateLabels: Record<CabinetSubscriptionState, string> = {
  active: 'Активна',
  expired: 'Срок действия истёк',
  not_started: 'Ещё не началась',
}

export function SubscriptionDialog({
  subscription,
  onClose,
}: {
  subscription?: CabinetSubscription
  onClose: () => void
}) {
  return (
    <CabinetDialog title="Статус подписки" testId="subscription-dialog" onClose={onClose}>
      {subscription ? (
        <SubscriptionDetails subscription={subscription} />
      ) : (
        <p className="cabinet-dialog-state">Данные о подписке пока недоступны. Попробуйте обновить страницу.</p>
      )}
    </CabinetDialog>
  )
}

function SubscriptionDetails({ subscription }: { subscription: CabinetSubscription }) {
  return (
    <>
      <p className="subscription-dialog-status" data-status={subscription.status}>
        {stateLabels[subscription.state]}
      </p>
      {subscription.expiresSoon && (
        <p className="subscription-dialog-warning" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          Подписка скоро закончится. Свяжитесь с администрацией для продления.
        </p>
      )}
      <div
        className="subscription-dialog-progress"
        role="progressbar"
        aria-label="Прошло срока подписки"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={subscription.progressPercent}
      >
        <span style={{ width: `${subscription.progressPercent}%` }} />
      </div>
      <dl className="cabinet-dialog-facts">
        <div>
          <dt>Начало</dt>
          <dd>{formatCalendarDate(subscription.startsAt)}</dd>
        </div>
        <div>
          <dt>Окончание</dt>
          <dd>{formatCalendarDate(subscription.endsAt)}</dd>
        </div>
        <div>
          <dt>Срок подписки</dt>
          <dd>{formatDayCount(subscription.totalDays)}</dd>
        </div>
        <div>
          <dt>Прошло</dt>
          <dd>{formatDayCount(subscription.elapsedDays)}</dd>
        </div>
        <div>
          <dt>Осталось</dt>
          <dd data-testid="subscription-days-left">{formatDayCount(subscription.daysLeft)}</dd>
        </div>
      </dl>
    </>
  )
}
