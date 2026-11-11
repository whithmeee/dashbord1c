import type { Input } from './admin'

export function changedFields(input: Input, original: Input): Input {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) =>
        !(key === 'password' && value === '') &&
        JSON.stringify(value) !== JSON.stringify(original[key]),
    ),
  )
}
