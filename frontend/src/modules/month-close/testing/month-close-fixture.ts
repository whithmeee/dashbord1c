export const monthCloseSummaryResponse = {
  integration_id: 7,
  month: '2026-10',
  generated_at: '2026-11-12T14:00:00+00:00',
  documents_total: 40,
  documents_flagged: 8,
  readiness: 80,
  checks: [
    { key: 'unposted', label: 'Не проведены', count: 3, status: 'critical' },
    { key: 'no_counterparty', label: 'Не указан контрагент', count: 2, status: 'warning' },
    { key: 'zero_amount', label: 'Нулевая сумма', count: 0, status: 'ok' },
    { key: 'anomalous_amount', label: 'Аномальная сумма', count: 3, status: 'warning' },
  ],
}

export const monthCloseDetailsResponse = {
  check: 'unposted',
  total: 1,
  items: [{
    check: 'unposted',
    entity: 'Document_ПоступлениеТоваровУслуг',
    entity_label: 'Поступление товаров и услуг',
    ref_key: 'document-1',
    number: '418',
    date: '2026-10-10',
    amount: 45630,
    message: 'Документ не проведён.',
  }],
}
