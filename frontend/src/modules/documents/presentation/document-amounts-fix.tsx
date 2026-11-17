import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { Select } from '../../../shared/ui/select'
import { vatRates } from '../domain/document-amounts'
import { formatDocumentAmount } from './document-status'
import './document-amounts-fix.css'

export function DocumentAmountsFix({ itemsSum, total, onAddVat, onMatchTotal }: {
  itemsSum: number
  total: number
  onAddVat: (rate: number) => void
  onMatchTotal: () => void
}) {
  const [rate, setRate] = useState(String(vatRates[1]))

  return (
    <div className="document-amounts-fix" role="group" aria-label="Расхождение сумм">
      <p>
        <Calculator size={16} />
        Сумма позиций {formatDocumentAmount(itemsSum)} ₽, сумма документа {formatDocumentAmount(total)} ₽.
        Если в позициях суммы указаны без НДС, прибавьте налог. Иначе выровняйте сумму документа.
      </p>
      <div className="document-amounts-actions">
        <Select ariaLabel="Ставка НДС для пересчёта" value={rate} options={vatRates.map((value) => ({ value: String(value), label: `НДС ${value}%` }))} onValueChange={setRate} />
        <button className="cabinet-button" type="button" onClick={() => onAddVat(Number(rate))}>Прибавить НДС к позициям</button>
        <button className="cabinet-button" type="button" onClick={onMatchTotal}>Сумма документа по позициям</button>
      </div>
    </div>
  )
}
