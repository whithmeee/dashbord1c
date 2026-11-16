import type { DocumentData, DocumentMatch, DocumentParty } from '../domain/document-draft'
import { formatDocumentAmount } from './document-status'
import './document-preview.css'

const matchLabels: Record<DocumentMatch, string> = {
  found: 'Найден в 1С',
  matched: 'Подобран, проверьте',
  missing: 'Нет в 1С',
}

export function DocumentPreview({ data }: { data: DocumentData }) {
  const kind = data.type === 'invoice' ? 'Счёт на оплату' : 'Поступление (УПД, накладная)'

  return (
    <article className="document-preview" data-testid="document-preview">
      <header>
        <span>{kind}</span>
        <h3>№ {data.number || '—'} от {formatDate(data.date)}</h3>
      </header>
      <div className="document-preview-parties">
        <Party title="Поставщик" party={data.counterparty} />
        <Party title="Покупатель" party={data.buyer} />
      </div>
      <p className="document-preview-contract">
        Договор: <MatchBadge match={data.contract.match} />
      </p>
      {data.type === 'receipt' && (
        <div className="document-preview-table" role="table" aria-label="Позиции документа">
          <div className="document-preview-row document-preview-head" role="row">
            <span>№</span><span>Наименование</span><span>Кол-во</span><span>Цена</span><span>Сумма</span><span>НДС</span><span>В 1С</span>
          </div>
          {data.items.map((item, index) => (
            <div className="document-preview-row" role="row" key={`${index}-${item.name}`}>
              <span>{index + 1}</span>
              <strong>{item.name || '—'}</strong>
              <span>{formatDocumentAmount(item.quantity)}</span>
              <span>{formatDocumentAmount(item.price)}</span>
              <span>{formatDocumentAmount(item.amount)}</span>
              <span>{item.vatRate || '—'}</span>
              <MatchBadge match={item.match} />
            </div>
          ))}
        </div>
      )}
      <footer>
        <span>Итого с НДС</span>
        <strong>{formatDocumentAmount(data.total)} ₽</strong>
      </footer>
      <p className="document-preview-note">В 1С документ попадёт непроведённым, провести его нужно будет вручную. Показаны сохранённые данные: после правок нажмите «Сохранить и проверить».</p>
    </article>
  )
}

function Party({ title, party }: { title: string; party: DocumentParty }) {
  const details = [party.inn && `ИНН ${party.inn}`, party.kpp && `КПП ${party.kpp}`].filter(Boolean).join(', ')

  return (
    <section>
      <span>{title}</span>
      <strong>{party.name || 'Не распознан'}</strong>
      {details && <small>{details}</small>}
      <small>
        В 1С: {party.catalogName ? `«${party.catalogName}» ` : ''}<MatchBadge match={party.match} />
      </small>
    </section>
  )
}

function MatchBadge({ match }: { match: DocumentMatch }) {
  return <em className={`document-preview-match document-preview-match-${match}`}>{matchLabels[match]}</em>
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}.${month}.${year}` : '—'
}
