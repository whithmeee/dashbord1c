export function valueToDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value)
  if (!match) return undefined
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] ?? 1))
}

export function dateToValue(value: Date): string {
  return [value.getFullYear(), pad(value.getMonth() + 1), pad(value.getDate())].join('-')
}

export function monthToValue(value: Date): string {
  return [value.getFullYear(), pad(value.getMonth() + 1)].join('-')
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
