import type { CatalogReport } from './report-catalog'

export const catalogReports: CatalogReport[] = [
  { id: 'sales', title: 'Реализации по месяцам', description: 'Сумма проведённых документов в выбранной валюте.', group: 'finance', format: 'chart', availability: 'real', keywords: 'реализации продажи' },
  { id: 'customers', title: 'Топ покупателей', description: 'Покупатели по сумме проведённых реализаций.', group: 'settlements', format: 'chart', availability: 'real', keywords: 'контрагенты покупатели' },
  { id: 'organizations', title: 'Реализации по организациям', description: 'Распределение документов между организациями.', group: 'finance', format: 'chart', availability: 'real', keywords: 'организации' },
  { id: 'receipts', title: 'Поступления на расчётный счёт', description: 'Входящие движения денег по банковским документам.', group: 'cash', format: 'chart', availability: 'real', keywords: 'банк поступления' },
  { id: 'payments', title: 'Списания с расчётного счёта', description: 'Исходящие движения денег по банковским документам.', group: 'cash', format: 'chart', availability: 'real', keywords: 'банк списания' },
  { id: 'documents', title: 'Количество реализаций', description: 'Число проведённых документов по месяцам.', group: 'finance', format: 'chart', availability: 'real', keywords: 'документы количество' },
]
