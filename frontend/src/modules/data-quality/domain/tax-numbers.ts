const INN_10_WEIGHTS = [2, 4, 10, 3, 5, 9, 4, 6, 8]
const INN_12_FIRST_WEIGHTS = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
const INN_12_SECOND_WEIGHTS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
const KPP_PATTERN = /^\d{4}[\dA-Z]{2}\d{3}$/

export function innError(value: string): string | null {
  if (value === '') return 'Введите ИНН.'
  if (!/^\d{10}$|^\d{12}$/.test(value)) return 'ИНН состоит из 10 цифр для организации или 12 для предпринимателя.'
  return hasValidChecksum(value) ? null : 'ИНН указан неверно: контрольная сумма не сходится.'
}

export function kppError(value: string): string | null {
  if (value === '') return 'Введите КПП.'
  return KPP_PATTERN.test(value) ? null : 'КПП состоит из 9 символов, например 770101001.'
}

function hasValidChecksum(inn: string): boolean {
  const digits = [...inn].map(Number)
  if (digits.length === 10) return checkDigit(digits, INN_10_WEIGHTS) === digits[9]
  return checkDigit(digits, INN_12_FIRST_WEIGHTS) === digits[10] && checkDigit(digits, INN_12_SECOND_WEIGHTS) === digits[11]
}

function checkDigit(digits: readonly number[], weights: readonly number[]): number {
  return weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) % 11 % 10
}
