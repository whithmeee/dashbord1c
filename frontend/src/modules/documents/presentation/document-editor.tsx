import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { DatePicker } from '../../../shared/ui/calendar-field'
import './document-editor.css'
import { addVat, amountsDifference, itemsSum } from '../domain/document-amounts'
import type { DocumentData, DocumentItem, DocumentParty } from '../domain/document-draft'
import { NO_UNIT, unitDiffers, unitOptions, withUnit } from '../domain/item-units'
import { Select } from '../../../shared/ui/select'
import { DocumentAmountsFix } from './document-amounts-fix'

export function DocumentEditor({ data, disabled, onSave }: {
  data: DocumentData
  disabled: boolean
  onSave: (data: DocumentData) => void
}) {
  const [value, setValue] = useState<DocumentData>(data)

  useEffect(() => setValue(data), [data])

  function party(key: 'counterparty' | 'buyer', field: keyof Pick<DocumentParty, 'name' | 'inn' | 'kpp'>, next: string) {
    setValue((current) => ({ ...current, [key]: { ...current[key], [field]: next } }))
  }

  function item(index: number, field: keyof Pick<DocumentItem, 'name' | 'quantity' | 'price' | 'amount'>, next: string) {
    setValue((current) => ({
      ...current,
      items: current.items.map((entry, entryIndex) => entryIndex === index
        ? { ...entry, [field]: field === 'name' ? next : numeric(next) }
        : entry),
    }))
  }

  function unit(index: number, next: string) {
    setValue((current) => ({
      ...current,
      items: current.items.map((entry, entryIndex) => entryIndex === index ? withUnit(entry, current.units, next) : entry),
    }))
  }

  function raiseWithVat(rate: number, indexes: readonly number[]) {
    setValue((current) => ({ ...current, items: addVat(current.items, rate, indexes) }))
  }

  function matchTotalToItems() {
    setValue((current) => ({ ...current, total: itemsSum(current.items) }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(value)
  }

  return (
    <form className="document-editor" onSubmit={submit}>
      <div className="document-editor-grid">
        <Field label="Номер"><input value={value.number} onChange={(event) => setValue({ ...value, number: event.target.value })} /></Field>
        <Field label="Дата"><DatePicker ariaLabel="Дата документа" value={value.date} onValueChange={(date) => setValue({ ...value, date })} /></Field>
        <Field label="Сумма"><input type="number" min="0" step="0.01" value={value.total} onChange={(event) => setValue({ ...value, total: numeric(event.target.value) })} /></Field>
      </div>
      <PartyFields title="Поставщик" party={value.counterparty} onChange={(field, next) => party('counterparty', field, next)} />
      <PartyFields title="Организация-покупатель" party={value.buyer} onChange={(field, next) => party('buyer', field, next)} />
      {value.items.length > 0 && (
        <section className="document-editor-items">
          <h3>Позиции</h3>
          {value.items.map((entry, index) => (
            <div className="document-editor-item" key={`${index}-${entry.name}`}>
              <Field label={`Позиция ${index + 1}`}><input value={entry.name} onChange={(event) => item(index, 'name', event.target.value)} /></Field>
              <UnitField item={entry} index={index} options={unitOptions(value.units)} onChange={(next) => unit(index, next)} />
              <Field label="Количество"><input type="number" min="0" step="0.0001" value={entry.quantity} onChange={(event) => item(index, 'quantity', event.target.value)} /></Field>
              <Field label="Цена"><input type="number" min="0" step="0.01" value={entry.price} onChange={(event) => item(index, 'price', event.target.value)} /></Field>
              <Field label="Сумма"><input type="number" min="0" step="0.01" value={entry.amount} onChange={(event) => item(index, 'amount', event.target.value)} /></Field>
            </div>
          ))}
        </section>
      )}
      {value.type === 'receipt' && value.items.length > 0 && amountsDifference(value.items, value.total) !== 0 && (
        <DocumentAmountsFix items={value.items} total={value.total} onAddVat={raiseWithVat} onMatchTotal={matchTotalToItems} />
      )}
      <button className="cabinet-button" type="submit" disabled={disabled}>Сохранить и проверить</button>
    </form>
  )
}

function UnitField({ item, index, options, onChange }: {
  item: DocumentItem
  index: number
  options: ReturnType<typeof unitOptions>
  onChange: (value: string) => void
}) {
  return (
    <div className="document-editor-field">
      <span>Ед. изм.</span>
      <Select ariaLabel={`Единица измерения, позиция ${index + 1}`} value={item.unitKey ?? NO_UNIT} options={options} onValueChange={onChange} />
      {unitDiffers(item) && <small className="document-editor-unit-note">В УПД: {item.unit}</small>}
    </div>
  )
}

function PartyFields({ title, party, onChange }: {
  title: string
  party: DocumentParty
  onChange: (field: 'name' | 'inn' | 'kpp', value: string) => void
}) {
  return (
    <section className="document-editor-party">
      <h3>{title}</h3>
      <div className="document-editor-grid">
        <Field label="Название"><input value={party.name} onChange={(event) => onChange('name', event.target.value)} /></Field>
        <Field label="ИНН"><input value={party.inn} onChange={(event) => onChange('inn', event.target.value)} /></Field>
        <Field label="КПП"><input value={party.kpp} onChange={(event) => onChange('kpp', event.target.value)} /></Field>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="document-editor-field"><span>{label}</span>{children}</label>
}

function numeric(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
