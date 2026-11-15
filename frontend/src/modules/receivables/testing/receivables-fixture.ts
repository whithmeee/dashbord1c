export const receivablesSummaryResponse = {
  integration_id: 7,
  month: '2026-10',
  generated_at: '2026-11-12T14:00:00+00:00',
  shipped: 2100000,
  paid: 1000000,
  outstanding: 1400000,
  debtors_total: 2,
  counterparties_total: 4,
  checks: [
    { key: 'unpaid', label: 'Нет оплаты за месяц', count: 1, status: 'critical' },
    { key: 'partial', label: 'Оплачено частично', count: 1, status: 'warning' },
    { key: 'overpaid', label: 'Оплат больше отгрузки', count: 0, status: 'ok' },
  ],
}

export const receivablesDetailsResponse = {
  check: 'partial',
  total: 1,
  items: [{
    check: 'partial',
    counterparty_key: 'buyer-1',
    counterparty: 'ООО Ромашка',
    shipped: 600000,
    paid: 200000,
    outstanding: 400000,
    message: 'Оплачено 200 000,00 из 600 000,00.',
  }],
}
