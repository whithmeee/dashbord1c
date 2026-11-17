import { UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter } from '../../../shared/ui/dialog'
import type { DocumentParty } from '../domain/document-draft'
import './counterparty-dialog.css'

export function CounterpartyDialog({ open, party, busy, onCreate, onClose }: {
  open: boolean
  party: DocumentParty
  busy: boolean
  onCreate: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      {open && (
        <DialogContent
          title="Создать контрагента в 1С"
          description="Поставщик будет добавлен в справочник контрагентов вашей базы. Если он там уже есть, дубль создан не будет."
          testId="counterparty-dialog"
        >
          <dl className="counterparty-details">
            <div><dt>Название</dt><dd>{party.name}</dd></div>
            <div><dt>ИНН</dt><dd>{party.inn}</dd></div>
            {party.kpp !== '' && <div><dt>КПП</dt><dd>{party.kpp}</dd></div>}
            <div><dt>Тип</dt><dd>{party.inn.length === 10 ? 'Юридическое лицо' : 'Индивидуальный предприниматель'}</dd></div>
          </dl>
          <DialogFooter>
            <button className="cabinet-button" type="button" onClick={onClose}>Отмена</button>
            <button className="cabinet-button cabinet-button-primary" type="button" disabled={busy} onClick={() => { onCreate(); onClose() }}>
              <UserPlus size={16} />Создать в 1С
            </button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
