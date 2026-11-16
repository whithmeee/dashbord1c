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

export function NomenclatureForm({ options, onCreate, onClose }: {
  options: NomenclatureOptions
  onCreate: (specs: readonly NomenclatureSpec[]) => void
  onClose: () => void
}) {
  const [rows, setRows] = useState<readonly Row[]>(() => options.items.map((item) => ({
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
  const selected = rows.filter((row) => row.selected)

  function change(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => row.index === index ? { ...row, ...patch } : row))
  }

  function submit() {
    onCreate(selected.map((row) => ({
      index: row.index,
      kindKey: orNull(row.kindKey),
      unitKey: orNull(row.unitKey),
      vatRate: orNull(row.vatRate),
    })))
    onClose()
  }

  if (rows.length === 0) {
    return <p className="nomenclature-state">Все позиции документа уже есть в справочнике 1С.</p>
  }

  return (
    <>
      <div className="nomenclature-list">
        {rows.map((row) => (
          <div className="nomenclature-row" key={row.index}>
            <label className="nomenclature-name">
              <Checkbox checked={row.selected} aria-label={`Создать позицию ${row.index + 1}`} onCheckedChange={(value) => change(row.index, { selected: value === true })} />
              <span>{row.name}</span>
            </label>
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
        <button className="cabinet-button" type="button" onClick={onClose}>Отмена</button>
        <button className="cabinet-button cabinet-button-primary" type="button" disabled={selected.length === 0} onClick={submit}>
          <PackagePlus size={16} />Создать в 1С ({selected.length})
        </button>
      </DialogFooter>
    </>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return <div className="nomenclature-field"><span>{label}</span>{children}</div>
}

function choices(options: readonly SelectOption[]): readonly SelectOption[] {
  return [{ value: NONE, label: 'Не указывать' }, ...options]
}

function orNull(value: string): string | null {
  return value === NONE ? null : value
}
