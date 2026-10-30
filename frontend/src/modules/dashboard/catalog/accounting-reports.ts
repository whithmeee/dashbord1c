import type { PlannedReport } from './report-catalog'

export const accountingReports: PlannedReport[] = [
  {
    id: 'trial-balance',
    title: 'Оборотно-сальдовая ведомость',
    description: 'Остатки и обороты по счетам бухгалтерского учёта.',
    group: 'accounting',
    format: 'table',
    keywords: 'ОСВ',
  },
  {
    id: 'account-balance',
    title: 'ОСВ по счёту',
    description: 'Остатки и обороты выбранного счёта с аналитикой.',
    group: 'accounting',
    format: 'table',
    keywords: 'оборотно сальдовая ведомость',
  },
  {
    id: 'account-card',
    title: 'Карточка счёта',
    description: 'Операции по счёту в хронологическом порядке.',
    group: 'accounting',
    format: 'table',
  },
  {
    id: 'account-analysis',
    title: 'Анализ счёта',
    description: 'Корреспонденция счёта и обороты за период.',
    group: 'accounting',
    format: 'table',
  },
  {
    id: 'account-turnover',
    title: 'Обороты счёта',
    description: 'Обороты выбранного счёта по периодам.',
    group: 'accounting',
    format: 'table',
  },
  {
    id: 'subconto-analysis',
    title: 'Анализ субконто',
    description: 'Остатки и обороты по объектам аналитического учёта.',
    group: 'accounting',
    format: 'table',
  },
  {
    id: 'postings',
    title: 'Сводные проводки',
    description: 'Сводка корреспонденций счетов за период.',
    group: 'accounting',
    format: 'table',
  },
  {
    id: 'general-ledger',
    title: 'Главная книга',
    description: 'Итоги по счетам с разбивкой по периодам.',
    group: 'accounting',
    format: 'table',
  },
  {
    id: 'chess-balance',
    title: 'Шахматная ведомость',
    description: 'Обороты в разрезе дебетовых и кредитовых счетов.',
    group: 'accounting',
    format: 'table',
  },
]
