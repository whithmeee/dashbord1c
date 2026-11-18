import type { DataQualityIssue } from './data-quality'

export type CounterpartyChange = {
  readonly inn?: string
  readonly kpp?: string
  readonly legalType?: 'individual'
}

export type Resolution =
  | { readonly kind: 'edit'; readonly field: 'inn' | 'kpp'; readonly suggestIndividual: boolean }
  | { readonly kind: 'advice'; readonly advice: string }

const INDIVIDUAL_INN_LENGTH = 12

const advices: Readonly<Record<string, string>> = {
  missing_contract: 'Создайте договор с этим контрагентом в 1С: откройте карточку контрагента, на вкладке «Договоры» нажмите «Создать» и укажите организацию, вид договора и валюту расчётов. Затем нажмите «Обновить» в Контроле данных.',
  duplicate_inn: 'У нескольких карточек совпадают ИНН и КПП. Откройте их в 1С и объедините: в разделе «Администрирование → Сервис» запустите «Поиск и удаление дублей» для справочника «Контрагенты». Перед объединением убедитесь, что это один и тот же контрагент. Затем нажмите «Обновить» в Контроле данных.',
}

const fallbackAdvice = 'Проверьте карточку объекта в 1С и исправьте данные вручную, затем нажмите «Обновить» в Контроле данных.'

export function resolutionOf(issue: DataQualityIssue): Resolution {
  switch (issue.rule) {
    case 'missing_inn':
    case 'invalid_inn':
      return { kind: 'edit', field: 'inn', suggestIndividual: false }
    case 'missing_kpp':
    case 'invalid_kpp':
      return { kind: 'edit', field: 'kpp', suggestIndividual: issue.fields.inn?.length === INDIVIDUAL_INN_LENGTH }
    default:
      return { kind: 'advice', advice: advices[issue.rule] ?? fallbackAdvice }
  }
}

export function resolvedRules(change: CounterpartyChange): readonly string[] {
  const rules: string[] = []
  if (change.inn !== undefined) rules.push('missing_inn', 'invalid_inn')
  if (change.kpp !== undefined || change.legalType !== undefined) rules.push('missing_kpp', 'invalid_kpp')
  return rules
}
