import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { Checkbox } from '../../../shared/ui/checkbox'
import { Select } from '../../../shared/ui/select'
import { addVat, itemsSum, vatRates } from '../domain/document-amounts'
import type { DocumentItem } from '../domain/document-draft'
import { formatDocumentAmount } from './document-status'
import './document-amounts-fix.css'

export function DocumentAmountsFix({ items, total, onAddVat, onMatchTotal }: {
  items: readonly DocumentItem[]
  total: number
  onAddVat: (rate: number, indexes: readonly number[]) => void
  onMatchTotal: () => void
}) {
  const [rate, setRate] = useState(String(vatRates[1]))
  const [unchecked, setUnchecked] = useState<readonly number[]>([])
  const selected = items.flatMap((_, index) => unchecked.includes(index) ? [] : [index])
  const sumAfter = itemsSum(addVat(items, Number(rate), selected))

  function toggle(index: number, checked: boolean) {
    setUnchecked((current) => checked ? current.filter((entry) => entry !== index) : [...current, index])
  }

  function toggleAll(checked: boolean) {
    setUnchecked(checked ? [] : items.map((_, index) => index))
  }

  return (
    <div className="document-amounts-fix" role="group" aria-label="Расхождение сумм">
      <p>
        <Calculator size={16} />
        Сумма позиций {formatDocumentAmount(itemsSum(items))} ₽, сумма документа {formatDocumentAmount(total)} ₽.
        Если суммы в позициях указаны без НДС, выберите позиции и прибавьте налог. Если позиции верны, а сумма документа распознана неточно, выровняйте её по позициям.
      </p>
      <label className="document-amounts-all">
        <Checkbox checked={selected.length === items.length} aria-label="Выбрать все позиции" onCheckedChange={(value) => toggleAll(value === true)} />
        <span>Выбрать все позиции ({selected.length} из {items.length})</span>
      </label>
      <div className="document-amounts-items">
        {items.map((item, index) => (
          <label className="document-amounts-item" key={`${index}-${item.name}`}>
            <Checkbox checked={!unchecked.includes(index)} aria-label={`Позиция ${index + 1}`} onCheckedChange={(value) => toggle(index, value === true)} />
            <span>{index + 1}. {item.name || 'Без названия'}</span>
            <strong>{formatDocumentAmount(item.amount)} ₽</strong>
          </label>
        ))}
      </div>
      <div className="document-amounts-actions">
        <Select ariaLabel="Ставка НДС для пересчёта" value={rate} options={vatRates.map((value) => ({ value: String(value), label: `НДС ${value}%` }))} onValueChange={setRate} />
        <button className="cabinet-button" type="button" disabled={selected.length === 0} onClick={() => onAddVat(Number(rate), selected)}>
          Прибавить НДС к выбранным ({selected.length})
        </button>
        <button className="cabinet-button" type="button" onClick={onMatchTotal}>Сумма документа = сумме позиций</button>
      </div>
      <small>После прибавления НДС сумма позиций будет {formatDocumentAmount(sumAfter)} ₽.</small>
    </div>
  )
}
