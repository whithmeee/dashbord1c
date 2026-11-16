import { useState, type ReactNode } from 'react'
import { PackagePlus } from 'lucide-react'
import { Checkbox } from '../../../shared/ui/checkbox'
import { DialogFooter } from '../../../shared/ui/dialog'
import { Select, type SelectOption } from '../../../shared/ui/select'
import type { NomenclatureOptions, NomenclatureSpec } from '../domain/nomenclature'

const NONE = 'none'

type Row = {
  readonly index: number
  readonly name: string
  readonly selected: boolean
  readonly kindKey: string
  readonly unitKey: string
  readonly vatRate: string
}

export function NomenclatureForm({ options, missing, busy, onCreate, onClose }: {
  options: NomenclatureOptions
  missing: readonly number[]
  busy: boolean
  onCreate: (specs: readonly NomenclatureSpec[]) => void
  onClose: () => void
}) {
  const [edited, setEdited] = useState<readonly Row[]>(() => options.items.map((item) => ({
    index: item.index,
    name: item.name,
    selected: true,
    kindKey: item.kindKey ?? NONE,
    unitKey: item.unitKey ?? NONE,
    vatRate: item.vatRate ?? NONE,
  })))
  const kinds = choices(options.kinds.map(({ key, name }) => ({ value: key, label: name })))
  const units = choices(options.units.map(({ key, name }) => ({ value: key, label: name })))
  const vatRates = choices(options.vatRates.map(({ value, label }) => ({ value, label })))
  const rows = edited.filter((row) => missing.includes(row.index))
  const selected = rows.filter((row) => row.selected)

  function change(index: number, patch: Partial<Row>) {
    setEdited((current) => current.map((row) => row.index === index ? { ...row, ...patch } : row))
  }

  function selectAll(value: boolean) {
    setEdited((current) => current.map((row) => ({ ...row, selected: value })))
  }

  if (rows.length === 0) {
    return (
      <>
        <p className="nomenclature-state">Все позиции документа есть в справочнике 1С.</p>
        <DialogFooter><button className="cabinet-button cabinet-button-primary" type="button" onClick={onClose}>Готово</button></DialogFooter>
      </>
    )
  }

  return (
    <>
      <label className="nomenclature-select-all">
        <Checkbox checked={selected.length === rows.length} aria-label="Выбрать все позиции" onCheckedChange={(value) => selectAll(value === true)} />
        <span>Выбрать все ({rows.length})</span>
      </label>
      <div className="nomenclature-list">
        {rows.map((row) => (
          <div className="nomenclature-row" key={row.index}>
            <div className="nomenclature-heading">
              <label className="nomenclature-name">
                <Checkbox checked={row.selected} aria-label={`Выбрать позицию ${row.index + 1}`} onCheckedChange={(value) => change(row.index, { selected: value === true })} />
                <span>{row.name}</span>
              </label>
              <button className="cabinet-button nomenclature-create-one" type="button" disabled={busy} onClick={() => onCreate([toSpec(row)])}>
                <PackagePlus size={15} />Создать
              </button>
            </div>
            <div className="nomenclature-fields">
              <Labeled label="Вид номенклатуры"><Select ariaLabel={`Вид номенклатуры, позиция ${row.index + 1}`} value={row.kindKey} options={kinds} onValueChange={(kindKey) => change(row.index, { kindKey })} /></Labeled>
              <Labeled label="Единица измерения"><Select ariaLabel={`Единица измерения, позиция ${row.index + 1}`} value={row.unitKey} options={units} onValueChange={(unitKey) => change(row.index, { unitKey })} /></Labeled>
              <Labeled label="Ставка НДС"><Select ariaLabel={`Ставка НДС, позиция ${row.index + 1}`} value={row.vatRate} options={vatRates} onValueChange={(vatRate) => change(row.index, { vatRate })} /></Labeled>
            </div>
          </div>
        ))}
      </div>
      <p className="nomenclature-hint">Если позиция с таким названием уже есть в 1С, дубль создан не будет.</p>
      <DialogFooter>
        <button className="cabinet-button" type="button" onClick={onClose}>Закрыть</button>
        <button className="cabinet-button cabinet-button-primary" type="button" disabled={busy || selected.length === 0} onClick={() => onCreate(selected.map(toSpec))}>
          <PackagePlus size={16} />Создать выбранные ({selected.length})
        </button>
      </DialogFooter>
    </>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return <div className="nomenclature-field"><span>{label}</span>{children}</div>
}

function toSpec(row: Row): NomenclatureSpec {
  return { index: row.index, kindKey: orNull(row.kindKey), unitKey: orNull(row.unitKey), vatRate: orNull(row.vatRate) }
}

function choices(options: readonly SelectOption[]): readonly SelectOption[] {
  return [{ value: NONE, label: 'Не указывать' }, ...options]
}

function orNull(value: string): string | null {
  return value === NONE ? null : value
}
