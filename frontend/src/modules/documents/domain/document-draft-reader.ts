export class InvalidDocumentDraftError extends Error {
  constructor(path: string) {
    super(`${path} has an invalid value`)
    this.name = 'InvalidDocumentDraftError'
  }
}

export function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InvalidDocumentDraftError(path)
  return value as Record<string, unknown>
}

export function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new InvalidDocumentDraftError(path)
  return value
}

export function nullableString(value: unknown, path: string): string | null {
  return value === null ? null : string(value, path)
}

export function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new InvalidDocumentDraftError(path)
  return value
}

export function integer(value: unknown, path: string): number {
  const result = number(value, path)
  if (!Number.isInteger(result)) throw new InvalidDocumentDraftError(path)
  return result
}

export function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new InvalidDocumentDraftError(path)
  return value
}

export function array(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new InvalidDocumentDraftError(path)
  return value
}

export function choice<const Value extends string>(value: unknown, choices: readonly Value[], path: string): Value {
  const result = string(value, path)
  if (!choices.includes(result as Value)) throw new InvalidDocumentDraftError(path)
  return result as Value
}
