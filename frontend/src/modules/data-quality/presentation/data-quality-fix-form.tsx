import { useState, type FormEvent } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { describeError } from '../../../shared/api'
import type { DataQualityIssue } from '../domain/data-quality'
import type { CounterpartyChange } from '../domain/data-quality-resolution'
import { innError, kppError } from '../domain/tax-numbers'
import './data-quality-resolution.css'

type EditResolution = { readonly field: 'inn' | 'kpp'; readonly suggestIndividual: boolean }

const labels = {
  inn: { title: 'ИНН', hint: '10 цифр для организации, 12 для предпринимателя', length: 12 },
  kpp: { title: 'КПП', hint: '9 символов, например 770101001', length: 9 },
} as const

export function DataQualityFixForm({ issue, resolution, onFix }: {
  issue: DataQualityIssue
  resolution: EditResolution
  onFix: (change: CounterpartyChange) => Promise<void>
}) {
  const { field } = resolution
  const [value, setValue] = useState(issue.fields[field] ?? '')
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function apply(change: CounterpartyChange) {
    setPending(true)
    setError(undefined)
    try {
      await onFix(change)
    } catch (failure: unknown) {
      setError(describeError(failure))
      setPending(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const normalized = value.trim().toUpperCase()
    const problem = field === 'inn' ? innError(normalized) : kppError(normalized)
    if (problem) {
      setError(problem)
      return
    }
    void apply({ [field]: normalized })
  }

  return (
    <form className="data-quality-fix" onSubmit={submit} data-testid="data-quality-fix-form">
      <label>
        <span>{labels[field].title}</span>
        <input value={value} maxLength={labels[field].length} inputMode={field === 'inn' ? 'numeric' : 'text'} autoComplete="off" disabled={pending} onChange={(event) => setValue(event.target.value)} />
        <small>{labels[field].hint}</small>
      </label>
      {error && <p className="data-quality-fix-error" role="alert">{error}</p>}
      <p className="data-quality-fix-note">Значение будет записано в карточку контрагента в 1С.</p>
      <div className="data-quality-fix-actions">
        <button className="cabinet-button cabinet-button-primary" type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="data-quality-spinner" size={16} /> : <Save size={16} />}Сохранить в 1С
        </button>
        {resolution.suggestIndividual && (
          <button className="cabinet-button" type="button" disabled={pending} onClick={() => void apply({ legalType: 'individual' })}>
            ИНН из 12 цифр: сменить тип на ИП
          </button>
        )}
      </div>
    </form>
  )
}
